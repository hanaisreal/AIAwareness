from typing import Dict, TypedDict, List

class FaceConfig(TypedDict):
    path: str
    opts: str

class ImageTargetConfig(TypedDict):
    targetImage: FaceConfig

class TargetFaceInVideo(TypedDict):
    opts: str # Primary key: opts for a face in the modifyVideo
    path: str # Optional: path to a crop/reference image of the face in video

class VideoTargetConfig(TypedDict):
    modifyVideoUrl: str
    targetFacesInVideo: List[TargetFaceInVideo] # Akool supports multiple target faces

class GenderScenarioConfig(TypedDict, total=False):
    image_swap: ImageTargetConfig # For image-to-image swap
    video_swap: VideoTargetConfig # For image-to-video swap

class ScenarioConfig(TypedDict):
    male: GenderScenarioConfig
    female: GenderScenarioConfig

# Face configurations for each scenario
FACE_CONFIGS: Dict[str, Dict[str, ScenarioConfig]] = {
    "FAKE_NEWS": {
        "SCENARIO1": {
            "male": {
                "image_swap": {
                    "targetImage": {
                        "path": "https://deepfake-videomaking.s3.us-east-1.amazonaws.com/video-url/deepfake_scenario1_man.png",
                        "opts": "916,187:1012,192:962,250:916,289"
                    }
                }
            },
            "female": {
                "image_swap": {
                    "targetImage": {
                        "path": "https://deepfake-videomaking.s3.us-east-1.amazonaws.com/video-url/deepfake_scenario1_female.png",
                        "opts": "1026,220:1138,223:1080,285:1023,326"
                    }
                }
            }
        },
        "SCENARIO2": {
            "male": {
                "image_swap": {
                    "targetImage": {
                        "path": "https://deepfake-videomaking.s3.us-east-1.amazonaws.com/video-url/deepfake_scenario2_man.png",
                        "opts": "775,222:873,221:819,285:790,336"
                    }
                }
            },
            "female": {
                "image_swap": {
                    "targetImage": {
                        "path": "https://deepfake-videomaking.s3.us-east-1.amazonaws.com/video-url/deepfake_scenario2_female.png",
                        "opts": "980,489:1103,483:1034,571:1007,629"
                    }
                }
            }
        }
    },
    "IDENTITY_THEFT": {
        "SCENARIO1": {
            "male": {
                "video_swap": {
                    "modifyVideoUrl": "https://deepfake-videomaking.s3.us-east-1.amazonaws.com/video-url/identitytheft_scenario2.mov",
                    "targetFacesInVideo": [
                        {
                            "opts": "354,475:561,455:465,576:396,708",
                            "path": "https://deepfake-videomaking.s3.us-east-1.amazonaws.com/video-url/identitytheft_scenario2_man.png"
                        }
                    ]
                }
            },
            "female": {
                "video_swap": {
                    "modifyVideoUrl": "https://deepfake-videomaking.s3.us-east-1.amazonaws.com/video-url/identitytheft_scenario2.mov",
                    "targetFacesInVideo": [
                        {
                            "opts": "354,475:561,455:465,576:396,708",
                            "path": "https://deepfake-videomaking.s3.us-east-1.amazonaws.com/video-url/identitytheft_scenario2_man.png"
                        }
                    ]
                }
            }
        }
    }
} 