import base64
import hashlib
import hmac
import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM


def _get_key(env_name: str) -> bytes:
    raw = os.getenv(env_name)
    if not raw:
        raise RuntimeError(f"Variável de ambiente {env_name} não configurada.")
    try:
        key = base64.b64decode(raw)
    except Exception as exc:
        raise RuntimeError(f"{env_name} deve estar em Base64 válido.") from exc
    if len(key) != 32:
        raise RuntimeError(f"{env_name} deve ter exatamente 32 bytes (256 bits).")
    return key


def hash_password(password: str) -> str:
    """Gera hash irreversível de senha com PBKDF2-HMAC-SHA256 e salt aleatório."""
    salt = os.urandom(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 310_000)
    return f"pbkdf2_sha256${base64.b64encode(salt).decode()}${base64.b64encode(dk).decode()}"


def verify_password(password: str, stored_hash: str) -> bool:
    """Verifica senha contra o hash armazenado em tempo constante."""
    if not password or not stored_hash:
        return False
    try:
        algo, salt_b64, dk_b64 = stored_hash.split("$", 2)
        if algo != "pbkdf2_sha256":
            return False
        salt = base64.b64decode(salt_b64)
        expected = base64.b64decode(dk_b64)
        actual = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 310_000)
        return hmac.compare_digest(actual, expected)
    except Exception:
        return False


def normalize_doc(doc: str | None) -> str:
    """Padroniza CPF, CNPJ ou CNH removendo caracteres não alfanuméricos."""
    if not doc:
        return ""
    return "".join(ch for ch in str(doc) if ch.isalnum()).upper()


def doc_lookup_hash(doc: str | None) -> str | None:
    """Gera HMAC-SHA256 determinístico para busca exata sem expor o documento."""
    normalized = normalize_doc(doc)
    if not normalized:
        return None
    lookup_key = _get_key("DOC_LOOKUP_KEY")
    return hmac.new(lookup_key, normalized.encode("utf-8"), hashlib.sha256).hexdigest()


def encrypt_value(plaintext: str | None) -> str | None:
    """Cifra valor sensível com AES-256-GCM (nonce de 12B + ciphertext+tag em Base64)."""
    if plaintext is None or str(plaintext) == "":
        return plaintext
    key = _get_key("DOC_ENCRYPTION_KEY")
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)
    ciphertext = aesgcm.encrypt(nonce, str(plaintext).encode("utf-8"), None)
    return base64.b64encode(nonce + ciphertext).decode("utf-8")


def decrypt_value(token: str | None) -> str | None:
    """Decifra valor gerado por encrypt_value; se não estiver cifrado, retorna como está."""
    if token is None or str(token) == "":
        return token
    try:
        key = _get_key("DOC_ENCRYPTION_KEY")
        raw = base64.b64decode(str(token).encode("utf-8"), validate=True)
        if len(raw) < 28:  # 12 bytes de nonce + pelo menos 16 bytes de tag GCM
            return str(token)
        nonce, ciphertext = raw[:12], raw[12:]
        aesgcm = AESGCM(key)
        plaintext = aesgcm.decrypt(nonce, ciphertext, None)
        return plaintext.decode("utf-8")
    except Exception:
        return str(token)