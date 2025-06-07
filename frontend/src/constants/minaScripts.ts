export interface MinaScript {
  id: string;
  text: string;
  // audioSrc?: string; // Temporarily keep if we need to refer to old MP3s during transition
}

export const MINA_DIALOGUE: Record<string, MinaScript> = {
  // --- HomePage ---
  HOME_INITIAL_GREETING: { 
    id: 'HOME_INITIAL_GREETING', 
    text: "안녕하세요! 딥페이크와 딥보이스 기술 체험에 오신 것을 환영합니다." 
  },
  HOME_PERSONALISED_GREETING_PROMPT: { 
    id: 'HOME_PERSONALISED_GREETING_PROMPT', 
    text: "우선, 원활한 체험 진행을 위해 인적사항을 입력해주세요." 
  },

  // --- Part 1 Common ---
  PART1_CONCEPT_VIDEO_INTRO: {
    id: 'PART1_CONCEPT_VIDEO_INTRO',
    text: "가짜 뉴스는 무엇을 의미할까요? 가짜 뉴스 또는 허위 뉴스는 뉴스라는 이름으로 위장하여 허위 또는 오해의 소지가 있는 정보를 퍼뜨리는 것을 의미합니다. 가짜 뉴스가 어떻게 딥페이크나 딥보이스를 통해 만들어지는지 살펴볼게요." // No direct old MP3, inferred
  },
  PART1_CONCEPT_VIDEO_OUTRO: {
    id: 'PART1_CONCEPT_VIDEO_OUTRO',
    text: "영상을 잘 보셨나요? 이제 이 기술이 어떻게 사용될 수 있는지, 그 사례들을 살펴볼게요." // No direct old MP3, inferred
  },
  PART1_CASE_STUDIES_INTRO: {
    id: 'PART1_CASE_STUDIES_INTRO',
    text: "화면에 보이는 사례 영상들을 통해 딥페이크가 어떻게 악용될 수 있는지, 그리고 우리가 어떻게 주의해야 하는지 알아보세요." // Previously: /part1/CASE_STUDY_INTRO.mp3 (combined with specific case audio)
  },
  PART1_FAKE_NEWS_CASE_1_INTRO: { // Example for a case study - will need one for each
    id: 'PART1_FAKE_NEWS_CASE_1_INTRO',
    text: "첫 번째 사례입니다. 이 영상에서는 유명 정치인이 하지 않은 말을 한 것처럼 조작된 상황을 보여줍니다." // Previously: /part1/FAKE_NEWS_CASE_1.mp3
  },
  PART1_FAKE_NEWS_CASE_2_INTRO: { 
    id: 'PART1_FAKE_NEWS_CASE_2_INTRO',
    text: "두 번째 사례에서는 유명 연예인의 얼굴이 다른 영상에 합성되어 가짜 스캔들을 만드는 모습을 보여줍니다." // Previously: /part1/FAKE_NEWS_CASE_2.mp3
  },
  PART1_FAKE_NEWS_CASE_3_INTRO: { 
    id: 'PART1_FAKE_NEWS_CASE_3_INTRO',
    text: "세 번째 사례는 일반인의 얼굴이 합성되어 가짜 음란물이나 모욕적인 영상에 사용된 경우입니다." // Previously: /part1/FAKE_NEWS_CASE_3.mp3
  },
  PART1_COMPREHENSION_QUESTION_PROMPT: {
    id: 'PART1_COMPREHENSION_QUESTION_PROMPT',
    text: "지금까지 보신 내용을 바탕으로 다음 질문에 답해주세요. 딥페이크 기술이 사용된 가짜 뉴스를 어떻게 구별할 수 있을까요?" // Previously: /part1/COMPREHENSION_QUESTION.mp3 (text might differ)
  },
  PART1_COMPREHENSION_FEEDBACK_CORRECT: {
    id: 'PART1_COMPREHENSION_FEEDBACK_CORRECT',
    text: "맞아요! 아주 잘 이해하셨네요. 내용을 꼼꼼히 확인하고, 출처를 살피는 것이 중요해요." // From existing constants
  },
  PART1_COMPREHENSION_FEEDBACK_INCORRECT: {
    id: 'PART1_COMPREHENSION_FEEDBACK_INCORRECT',
    text: "아쉽지만 정답이 아니에요. 괜찮아요! 중요한 건 비판적으로 정보를 바라보는 자세랍니다. 다시 한번 생각해볼까요?" // From existing constants
  },
  PART1_EXPERIENCE_INTRO: {
    id: 'PART1_EXPERIENCE_INTRO',
    text: "이제 직접 딥페이크 이미지를 만들어보는 체험을 해볼 거예요. 첫 번째 시나리오로 이동할게요." // Previously: /part1/EXPERIENCE_INTRO.mp3
  },
  PART1_SCENARIO1_PRE_IMAGE_UPLOAD: { 
    id: 'PART1_SCENARIO1_PRE_IMAGE_UPLOAD', 
    text: "이 시나리오에서는 어르신의 사진을 사용하여 뉴스 앵커가 된 어르신의 모습을 만들어 볼 거예요. 설명을 다 들으셨으면 다음 버튼을 눌러 사진을 올려주세요." 
  },
  PART1_SCENARIO2_PRE_IMAGE_UPLOAD: { 
    id: 'PART1_SCENARIO2_PRE_IMAGE_UPLOAD', 
    text: "이번 시나리오에서는 어르신의 사진을 사용하여 영화 포스터의 주인공이 된 어르신의 모습을 만들어 볼 거예요. 설명을 다 들으셨으면 다음 버튼을 눌러주세요." 
  },
  PART1_OUTRO: {
    id: 'PART1_OUTRO',
    text: "첫 번째 체험이 모두 끝났어요. 딥페이크 기술의 위험성과 가능성에 대해 조금이나마 이해가 되셨기를 바라요. 다음 파트로 이동해볼까요?" // Previously: /part1/OUTRO.mp3
  },

  // --- Part 2 Common ---
  PART2_MAIN_INTRO: {
    id: 'PART2_MAIN_INTRO',
    text: "두 번째 체험에 오신 것을 환영합니다! 여기서는 목소리 위변조 기술인 딥보이스에 대해 알아보고 체험해볼 거예요." // Previously: /part2/GREETING.mp3
  },
  PART2_CONCEPT_VIDEO_INTRO: {
    id: 'PART2_CONCEPT_VIDEO_INTRO',
    text: "먼저, 딥보이스 기술과 관련된 짧은 개념 영상을 시청하시겠습니다. 영상이 끝나면 다음 단계로 진행됩니다." // No direct old MP3, inferred
  },
  PART2_CONCEPT_VIDEO_OUTRO: {
    id: 'PART2_CONCEPT_VIDEO_OUTRO',
    text: "영상 잘 보셨나요? 이제 딥보이스가 어떻게 활용될 수 있는지, 실제 사례들을 통해 살펴볼게요." // No direct old MP3, inferred
  },
  PART2_CASE_STUDIES_INTRO: {
    id: 'PART2_CASE_STUDIES_INTRO',
    text: "이제 목소리 위변조와 관련된 다양한 사례들을 살펴볼 시간입니다. 각 사례를 통해 이 기술이 우리 생활에 어떤 영향을 미칠 수 있는지 알아보세요." // Previously: /part2/CASE_STUDY_INTRO.mp3 (combined)
  },
  PART2_VOICE_PHISHING_CASE_INTRO: {
    id: 'PART2_VOICE_PHISHING_CASE_INTRO',
    text: "첫 번째 사례는 보이스 피싱 사기입니다. 범죄자들이 어떻게 목소리를 위조하여 돈을 요구하는지 들어보세요." // Previously: /part2/VOICE_PHISHING_CASE.mp3
  },
  PART2_FAMOUS_VOICE_CASE_INTRO: {
    id: 'PART2_FAMOUS_VOICE_CASE_INTRO',
    text: "두 번째 사례는 유명인의 목소리를 도용하여 가짜 메시지를 퍼뜨리는 경우입니다." // Previously: /part2/FAMOUS_VOICE_CASE.mp3
  },
  PART2_AI_ASSISTANT_CASE_INTRO: {
    id: 'PART2_AI_ASSISTANT_CASE_INTRO',
    text: "세 번째 사례는 AI 비서나 상담 서비스에 딥보이스 기술이 긍정적으로 활용될 수 있는 가능성을 보여줍니다." // Previously: /part2/AI_ASSISTANT_CASE.mp3
  },
  PART2_COMPREHENSION_QUESTION_PROMPT: {
    id: 'PART2_COMPREHENSION_QUESTION_PROMPT',
    text: "지금까지 보신 내용을 바탕으로, 딥보이스 기술의 가장 큰 위험은 무엇이라고 생각하시나요?" // Previously: /part2/COMPREHENSION_QUESTION.mp3 (text might differ)
  },
  PART2_COMPREHENSION_FEEDBACK_CORRECT: {
    id: 'PART2_COMPREHENSION_FEEDBACK_CORRECT',
    text: "정확해요! 목소리 위변조는 사칭이나 사기에 악용될 수 있다는 점이 큰 위험이죠." // From existing constants
  },
  PART2_COMPREHENSION_FEEDBACK_INCORRECT: {
    id: 'PART2_COMPREHENSION_FEEDBACK_INCORRECT',
    text: "좋은 의견이지만, 조금 더 생각해볼까요? 핵심은 '신뢰성'을 해칠 수 있다는 점이에요." // From existing constants
  },
  PART2_EXPERIENCE_INTRO_VOICE_CLONING: { // Replaces PART2_SCENARIOS_INTRO.mp3
    id: 'PART2_EXPERIENCE_INTRO_VOICE_CLONING',
    text: "이제 직접 딥보이스 기술을 체험해볼 시간이에요. 첫 번째 단계로, 어르신의 목소리를 복제해보겠습니다. 다음 화면의 안내에 따라주세요." 
  },
  PART2_SCENARIO1_VOICE_CLONING_INITIAL_INSTRUCTIONS: {
    id: 'PART2_SCENARIO1_VOICE_CLONING_INITIAL_INSTRUCTIONS', 
    text: "어르신의 목소리를 복제하려면, 화면에 보이는 글을 읽어 녹음해주셔야 해요. 준비가 되면 '녹음 시작' 버튼을 누르고, 마이크 접근을 허용해주세요. 천천히, 명확하게 읽어주시면 더 좋은 결과를 얻을 수 있답니다." 
  },
  // PART2_SCENARIO_1_SCRIPT is for user to read, not Mina to speak.
  PART2_SCENARIO1_AFTER_CLONING_SUCCESS: {
    id: 'PART2_SCENARIO1_AFTER_CLONING_SUCCESS',
    text: "목소리 복제가 성공적으로 완료되었어요! 이제 이 목소리로 첫 번째 샘플 음성을 생성해볼게요." // New
  },
  PART2_SCENARIO1_PLAY_GENERATED_SAMPLE: {
    id: 'PART2_SCENARIO1_PLAY_GENERATED_SAMPLE',
    text: "방금 생성된 어르신의 목소리 샘플입니다. 한번 들어보세요." // New
  },
  PART2_SCENARIO2_INTRO_AND_PLAY_SAMPLE: {
    id: 'PART2_SCENARIO2_INTRO_AND_PLAY_SAMPLE',
    text: "이번에는 복제된 어르신의 목소리로 다른 내용의 음성을 생성해볼게요. 아래 생성된 음성을 들어보세요." // New
  },
  PART2_SCENARIO3_VIDEO_FACE_SWAP_INTRO: {
    id: 'PART2_SCENARIO3_VIDEO_FACE_SWAP_INTRO',
    text: "마지막 체험입니다! 이번에는 어르신의 얼굴을 동영상에 합성해볼 거예요. 파트 1에서 사용했던 사진을 그대로 사용하거나, 새로운 사진을 업로드할 수 있습니다." // New
  },
  PART2_OUTRO: {
    id: 'PART2_OUTRO',
    text: "두 번째 체험도 모두 완료하셨네요! 목소리 위변조 기술의 세계, 어떠셨나요? 이제 모든 체험을 마치셨습니다. 수고하셨습니다!" // Previously: /part2/OUTRO.mp3
  },

  // Generic
  PROCEED_TO_NEXT_STEP: {
    id: 'PROCEED_TO_NEXT_STEP',
    text: "다음 단계로 진행할까요?"
  },
  LOADING_AUDIO: {
    id: 'LOADING_AUDIO',
    text: "음성을 준비 중입니다. 잠시만 기다려주세요..."
  },
  ERROR_AUDIO_GENERAL: {
    id: 'ERROR_AUDIO_GENERAL',
    text: "음성을 재생하는데 문제가 발생했어요. 다음 버튼을 눌러 계속 진행해주세요."
  }
};

// We can deprecate the old MINA_SCRIPTS objects once all pages are updated.
// For now, keeping them for reference or phased migration if needed.

export const OLD_MINA_SCRIPTS = {
  // Part 1 scripts
  GREETING: '/part1/GREETING.mp3',
  CONCEPT_EXPLANATION: '/part1/CONCEPT_EXPLANATION.mp3', // Already migrated
  CONCEPT_EXPLANATION_GENERIC: '/part1/CONCEPT_EXPLANATION.mp3', // Same as above
  CASE_STUDY_INTRO: '/part1/CASE_STUDY_INTRO.mp3',
  FAKE_NEWS_CASE_1: '/part1/FAKE_NEWS_CASE_1.mp3',
  FAKE_NEWS_CASE_2: '/part1/FAKE_NEWS_CASE_2.mp3',
  FAKE_NEWS_CASE_3: '/part1/FAKE_NEWS_CASE_3.mp3',
  COMPREHENSION_QUESTION: '/part1/COMPREHENSION_QUESTION.mp3',
  EXPERIENCE_INTRO: '/part1/EXPERIENCE_INTRO.mp3',
  SCENARIO_SELECTION_PROMPT: '/part1/SCENARIO_SELECTION_PROMPT.mp3', // This seems unused now
  OUTRO: '/part1/OUTRO.mp3',

  // Part 1 comprehension feedback (text only, already somewhat centralized)
  FEEDBACK_CORRECT_TEXT: "맞아요! 아주 잘 이해하셨네요. 내용을 꼼꼼히 확인하고, 출처를 살피는 것이 중요해요.",
  FEEDBACK_INCORRECT_TEXT: "아쉽지만 정답이 아니에요. 괜찮아요! 중요한 건 비판적으로 정보를 바라보는 자세랍니다. 다시 한번 생각해볼까요?",
};

export const OLD_MINA_SCRIPTS_PART2 = {
  // Part 2 scripts
  GREETING: '/part2/GREETING.mp3',
  CONCEPT_EXPLANATION: '/part2/CONCEPT_EXPLANATION.mp3',
  CASE_STUDY_INTRO: '/part2/CASE_STUDY_INTRO.mp3',
  VOICE_PHISHING_CASE: '/part2/VOICE_PHISHING_CASE.mp3',
  FAMOUS_VOICE_CASE: '/part2/FAMOUS_VOICE_CASE.mp3',
  AI_ASSISTANT_CASE: '/part2/AI_ASSISTANT_CASE.mp3',
  COMPREHENSION_QUESTION: '/part2/COMPREHENSION_QUESTION.mp3',
  SCENARIOS_INTRO: '/part2/SCENARIOS_INTRO.mp3', // Replaced by PART2_EXPERIENCE_INTRO_VOICE_CLONING
  OUTRO: '/part2/OUTRO.mp3',

  // Part 2 comprehension feedback (text only)
  FEEDBACK_CORRECT_TEXT: "정확해요! 목소리 위변조는 사칭이나 사기에 악용될 수 있다는 점이 큰 위험이죠.",
  FEEDBACK_INCORRECT_TEXT: "좋은 의견이지만, 조금 더 생각해볼까요? 핵심은 '신뢰성'을 해칠 수 있다는 점이에요.",

  // Part 2 Scenario Scripts (for user to read, not Mina to speak)
  PART2_SCENARIO_1_SCRIPT_TEXT: "제 이름은 [사용자 이름]입니다. 지금부터 딥보이스 기술을 체험해보겠습니다.",
  PART2_SCENARIO_2_SCRIPT_TEXT: "이 목소리는 방금 복제된 제 목소리입니다. 정말 신기하네요!",
};

// Mapping from old script keys to new MINA_DIALOGUE keys (for easier transition)
// This is illustrative and might not be exhaustive
export const SCRIPT_KEY_MAP: Record<string, string> = {
  // Part 1
  'GREETING': 'PART1_MAIN_INTRO',
  'CONCEPT_EXPLANATION_GENERIC': 'PART1_CONCEPT_EXPLANATION',
  'CASE_STUDY_INTRO': 'PART1_CASE_STUDIES_INTRO',
  'FAKE_NEWS_CASE_1': 'PART1_FAKE_NEWS_CASE_1_INTRO',
  'FAKE_NEWS_CASE_2': 'PART1_FAKE_NEWS_CASE_2_INTRO',
  'FAKE_NEWS_CASE_3': 'PART1_FAKE_NEWS_CASE_3_INTRO',
  'COMPREHENSION_QUESTION': 'PART1_COMPREHENSION_QUESTION_PROMPT',
  'EXPERIENCE_INTRO': 'PART1_EXPERIENCE_INTRO',
  'OUTRO': 'PART1_OUTRO',
  // Part 2
  'GREETING_P2': 'PART2_MAIN_INTRO', // Assuming GREETING from MINA_SCRIPTS_PART2
  'CONCEPT_EXPLANATION_P2': 'PART2_CONCEPT_EXPLANATION', // Assuming CONCEPT_EXPLANATION from MINA_SCRIPTS_PART2
  'CASE_STUDY_INTRO_P2': 'PART2_CASE_STUDIES_INTRO',
  'VOICE_PHISHING_CASE': 'PART2_VOICE_PHISHING_CASE_INTRO',
  'FAMOUS_VOICE_CASE': 'PART2_FAMOUS_VOICE_CASE_INTRO',
  'AI_ASSISTANT_CASE': 'PART2_AI_ASSISTANT_CASE_INTRO',
  'COMPREHENSION_QUESTION_P2': 'PART2_COMPREHENSION_QUESTION_PROMPT',
  'SCENARIOS_INTRO_P2': 'PART2_EXPERIENCE_INTRO_VOICE_CLONING',
  'OUTRO_P2': 'PART2_OUTRO',
}; 