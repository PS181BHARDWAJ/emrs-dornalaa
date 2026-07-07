from pydantic import BaseModel
from typing import Optional


class CampusHero(BaseModel):

    title:str

    subtitle:str

    banner_image:Optional[str]=None

    overlay_opacity:float=0.35



class CampusStats(BaseModel):

    students:int

    security:int

    residential:int

    sports:int



class CampusGallery(BaseModel):

    id:Optional[str]=None

    title:str

    caption:str

    image:str

    featured:bool=False

    display_order:int=0

    status:bool=True