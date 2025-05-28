import json
import time
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

from langchain.docstore.document import Document
from langchain_community.vectorstores import FAISS
from sentence_transformers import SentenceTransformer
from langchain.embeddings.base import Embeddings

# Local embeddings class implementing the required abstract methods
class LocalEmbeddings(Embeddings):
    def __init__(self):
        self.model = SentenceTransformer('all-MiniLM-L6-v2')

    def embed_documents(self, texts):
        return self.model.encode(texts, convert_to_numpy=True).tolist()

    def embed_query(self, text):
        return self.model.encode([text], convert_to_numpy=True)[0].tolist()

embedding = LocalEmbeddings()

def build_faiss_index():
    with open("db.json", "r") as f:
        data = json.load(f)

    docs = []
    for entry in data:
        name = entry.get("name", "unknown")
        timestamp = entry.get("timestamp", "unknown")
        text = f"Name: {name}, Registered at: {timestamp}"
        docs.append(Document(page_content=text))

    faiss_index = FAISS.from_documents(docs, embedding)
    faiss_index.save_local("faiss_index")
    print("FAISS index rebuilt!")

class DBChangeHandler(FileSystemEventHandler):
    def on_modified(self, event):
        if event.src_path.endswith("db.json"):
            print("db.json changed, rebuilding FAISS index...")
            build_faiss_index()

if __name__ == "__main__":
    build_faiss_index()  # build once at start

    event_handler = DBChangeHandler()
    observer = Observer()
    observer.schedule(event_handler, ".", recursive=False)
    observer.start()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()
