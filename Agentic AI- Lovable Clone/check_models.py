import os
from dotenv import load_dotenv
from groq import Groq

# Load environment variables
load_dotenv()

api_key = os.getenv("GROQ_API_KEY")

if not api_key:
    print("❌ Error: GROQ_API_KEY not found in .env file.")
    print("Please add: GROQ_API_KEY=gsk_... to your .env file.")
else:
    print(f"✅ Using Groq Key: {api_key[:10]}... (verified present)")
    
    try:
        print("\nConnecting to Groq API...")
        client = Groq(api_key=api_key)
        
        # Fetch the list of models
        models = client.models.list()
        
        print("\n--- 📋 Available Groq Models ---")
        print(f"{'Model ID':<35} | {'Developer':<15}")
        print("-" * 55)
        
        for model in models.data:
            # Only print active models
            print(f"{model.id:<35} | {model.owned_by:<15}")
            
    except Exception as e:
        print(f"\n❌ Error accessing Groq API: {e}")