export interface Part3Script {
  id: number;
  text: string;
  audioSrc: string;
}

export const part3Scripts: Part3Script[] = [
  {
    id: 1,
    text: "AI 기술이 점점 더 정교해지고 있는 요즘, 가장 중요한 건 우리 스스로를 지키는 힘입니다. 그렇다면, 우리는 어떻게 행동해야 할까요?",
    audioSrc: "/part3/part3_script_1.mp3",
  },
  {
    id: 2,
    text: "첫 번째는 '멈추기'입니다. 갑자기 돈을 송금해달라는 전화, 링크를 눌러보라는 메시지, 지인이라며 걸려오는 영상통화, 심지어 아무 말도 하지 않는 이상한 전화까지. 이럴 땐 무조건 '멈추고' 생각해보세요.",
    audioSrc: "/part3/part3_script_2.mp3",
  },
  {
    id: 3,
    text: "두 번째는 '확인하기'입니다. 들리는 목소리나 영상이 자연스러운지, 상대가 정말 아는 사람인지, 말투나 배경은 어색하지 않은지.작은 단서들이 가짜를 구별해주는 실마리가 됩니다. 무작정 믿기보단, '의심하고 확인하는 습관'이 필요해요.",
    audioSrc: "/part3/part3_script_3.mp3",
  },
  {
    id: 4,
    text: "세 번째는 우리 가족만의 비밀 암호 만들기입니다. 만약 누군가가 가족을 사칭해 연락해온다면, 우리만 아는 암호 질문으로 진짜인지 확인할 수 있어요. 예를 들어 \"좋아하는 숫자가 뭐야?\"라고 물었을 때, 가족끼리 약속한 \"1004\"라는 답이 나와야 하는 식이죠.",
    audioSrc: "/part3/part3_script_4.mp3",
  },
  {
    id: 5,
    text: "무엇보다 중요한 건, SNS에 사진이나 개인정보를 함부로 올리지 않는 것입니다. 내 정보는 물론, 타인의 사진이나 영상도 꼭 동의를 받은 후 공유해야 해요.",
    audioSrc: "/part3/part3_script_5.mp3",
  },
  {
    id: 6,
    text: "딥페이크와 딥보이스 기술이 발전하더라도, 우리가 '멈추고, 확인하고, 대비'할 수 있다면, AI 세상도 충분히 안전하게 살아갈 수 있습니다.",
    audioSrc: "/part3/part3_script_6.mp3",
  },
];

export const TALKING_GIF_SRC = "/talking.gif";
export const MINA_IDLE_PNG_SRC = "/mina_idle.png"; 