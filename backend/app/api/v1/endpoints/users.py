from fastapi import APIRouter

from app.api.deps import CurrentUser
from app.schemas.user import UserRead

router = APIRouter()


@router.get(
    "/me",
    response_model=UserRead,
    summary="Get the currently authenticated user",
)
def get_me(current_user: CurrentUser) -> UserRead:
    """
    Returns the profile of the user identified by the access-token cookie.
    Raises HTTP 401 if the token is missing or invalid.
    """
    return UserRead.model_validate(current_user)
