from pydantic import BaseModel


class MessageResponse(BaseModel):
    """Generic single-message response envelope."""
    message: str
