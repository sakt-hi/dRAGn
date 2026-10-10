import os

from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL")

EMBEDDING_MODEL = "BAAI/bge-small-en-v1.5"

CHUNK_SIZE = 700
CHUNK_OVERLAP = 100

# Retrieval configuration

DENSE_TOP_K = 10
SPARSE_TOP_K = 10
FINAL_TOP_K = 5

RRF_K = 60

DENSE_WEIGHT = 0.5
SPARSE_WEIGHT = 0.5