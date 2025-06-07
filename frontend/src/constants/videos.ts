export const VIDEO_URLS = {
  // Part 1: Fake News
  FAKE_NEWS: {
    // Concept (1 video)
    CONCEPT: {
      MAIN: "https://deepfake-videomaking.s3.us-east-1.amazonaws.com/video-url/deepfake_concept.m4v"
    },
    // Cases (3 videos)
    CASES: {
      CASE1: "https://deepfake-videomaking.s3.us-east-1.amazonaws.com/video-url/part1_case1.m4v",
      CASE2: "https://deepfake-videomaking.s3.us-east-1.amazonaws.com/video-url/part1_case2.mov",
      CASE3: "https://deepfake-videomaking.s3.us-east-1.amazonaws.com/video-url/part1_case3.mov"
    },
    // Experience (2 scenarios with gender variations)
    EXPERIENCE: {
      SCENARIO1: {
        male: {
          path: "https://deepfake-videomaking.s3.us-east-1.amazonaws.com/video-url/deepfake_scenario1_man.png",
          opts: "916,187:1012,192:962,250:916,289"
        },
        female: {
          path: "https://deepfake-videomaking.s3.us-east-1.amazonaws.com/video-url/deepfake_scenario1_female.png",
          opts: "1026,220:1138,223:1080,285:1023,326"
        }
      },
      SCENARIO2: {
        male: {
          path: "https://deepfake-videomaking.s3.us-east-1.amazonaws.com/video-url/deepfake_scenario2_man.png",
          opts: "775,222:873,221:819,285:790,336"
        },
        female: {
          path: "https://deepfake-videomaking.s3.us-east-1.amazonaws.com/video-url/deepfake_scenario2_female.png",
          opts: "980,489:1103,483:1034,571:1007,629"
        }
      }
    }
  },
  // Part 2: Identity Theft
  IDENTITY_THEFT: {
    // Concept (1 video)
    CONCEPT: {
      MAIN: "https://deepfake-videomaking.s3.us-east-1.amazonaws.com/video-url/identitytheft_concept.mp4"
    },
    // Cases (2 videos)
    CASES: {
      CASE1: "https://deepfake-videomaking.s3.us-east-1.amazonaws.com/video-url/identitytheft_case1.m4v",
      CASE2: "https://deepfake-videomaking.s3.us-east-1.amazonaws.com/video-url/Identitytheft_case2.mp4"
    },
    // Experience (3 scenarios)
    EXPERIENCE: {
      SCENARIO3: {
        male: "https://deepfake-videomaking.s3.us-east-1.amazonaws.com/video-url/identitytheft_scenario2.mov",
        female: "https://deepfake-videomaking.s3.us-east-1.amazonaws.com/video-url/identitytheft_scenario2.mov"
      }
  }
}
}; 