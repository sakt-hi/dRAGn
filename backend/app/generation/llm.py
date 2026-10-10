import re

from groq import Groq

from app.core.config import GROQ_API_KEY, GROQ_MODEL


class LLMGenerator:
    """
    LLM generation layer.

    Currently uses Groq as the underlying provider,
    but keeps the generation interface provider-agnostic.
    """

    def __init__(self):
        self.client = Groq(api_key=GROQ_API_KEY)
        self.model = GROQ_MODEL

    def generate(self, question: str, chunks: list) -> str:
        context_parts = []

        for index, item in enumerate(chunks):
            chunk = item["chunk"]

            context_parts.append(
                f"""
[{index + 1}]
Source: {chunk['source']}
Chunk ID: {chunk['chunk_id']}

{chunk['text']}
"""
            )

        context = "\n".join(context_parts)

        system_prompt = """
You are a documentation question-answering assistant.

Answer the user's question using ONLY the CONTEXT provided by the user.

If the answer is present in the context, answer it directly.

If the answer is NOT present in the context, say:

"I couldn't find the answer in the provided documentation."

Rules:
- Do not use outside knowledge.
- Do not make up information.
- Each factual statement must include a citation.
- Use ONLY citations in the exact format [1], [2], [3], etc.
- The citation number refers to the CONTEXT item number.
- NEVER generate line numbers.
- NEVER use formats such as 【1†L4-L7】.
- NEVER invent citation numbers.
- Keep the answer concise.
"""

        print("\n" + "=" * 80)
        print("CONTEXT SENT TO LLM")
        print("=" * 80)
        print(context)
        print("=" * 80)

        response = self.client.chat.completions.create(
            model=self.model,
            temperature=0,
            messages=[
                {
                    "role": "system",
                    "content": system_prompt,
                },
                {
                    "role": "user",
                    "content": f"""
CONTEXT
=======

{context}

END CONTEXT

QUESTION
========

{question}

ANSWER USING ONLY THE CONTEXT ABOVE.
""",
                },
            ],
        )

        answer = response.choices[0].message.content.strip()

        # Normalize alternative citation format occasionally
        # produced by the model: 【1】 -> [1]
        answer = re.sub(
            r"【(\d+)】",
            r"[\1]",
            answer,
        )

        # IMPORTANT:
        # Keep [1], [2], etc. in the answer.
        #
        # These are citation IDs, not display strings.
        # The backend will resolve them into structured citation
        # objects, and the frontend will make them clickable.

        return answer