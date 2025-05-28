from fastapi import FastAPI, WebSocket
from datetime import datetime
import json
import os

from langchain.chains import RetrievalQA
from langchain_community.vectorstores import FAISS
from langchain.docstore.document import Document
from sentence_transformers import SentenceTransformer
from langchain.embeddings.base import Embeddings 

app = FastAPI()

# Load your DB
with open("db.json", "r") as f:
    db = json.load(f)

# Local Embedding setup
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')

class LocalEmbeddings(Embeddings):
    def __init__(self, model_name='all-MiniLM-L6-v2'):
        self.model = SentenceTransformer(model_name)

    def embed_documents(self, texts):
        return self.model.encode(texts, convert_to_numpy=True).tolist()

    def embed_query(self, text):
        return self.model.encode([text], convert_to_numpy=True)[0].tolist()

embedding = LocalEmbeddings()

# Load FAISS Index
retriever = FAISS.load_local("faiss_index", embedding, allow_dangerous_deserialization=True).as_retriever()

# Simple local LLM-like response logic (can be upgraded with real local LLM later)
def local_answer(query: str, context: str):
    return f"Based on the data: {context}\nAnswer: Sorry, I can’t fully understand the question yet."

def answer_query(query: str):
    if "last person registered" in query:
        last = max(db, key=lambda x: x["timestamp"])
        return f"{last['name']} was the last person registered at {last['timestamp']}."
    elif "registered" in query and "time" in query:
        name = query.split("was")[-1].replace("registered?", "").strip()
        for person in db:
            if person["name"].lower() == name.lower():
                return f"{person['name']} was registered at {person['timestamp']}."
        return "No such person found."
    elif "how many" in query and "registered" in query:
        return f"There are currently {len(db)} people registered."
    else:
        # Retrieval response
        docs = retriever.get_relevant_documents(query)
        context = "\n".join([doc.page_content for doc in docs])
        return local_answer(query, context)


@app.websocket("/chat")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    while True:
        try:
            data = await websocket.receive_text()
            response = answer_query(data)
            await websocket.send_text(response)
        except Exception as e:
            print("WebSocket error:", e)
            await websocket.send_text("Error: Something went wrong.")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("rag_engine:app", host="0.0.0.0", port=8000, reload=True)

