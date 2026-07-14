import type Ionicons from '@expo/vector-icons/Ionicons';
import { ROUTINE_COLORS } from './theme';

export type RoutineTemplate = {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
  repeatCount: number;
  steps: { title: string; durationSec: number }[];
};

export const ROUTINE_TEMPLATES: RoutineTemplate[] = [
  {
    id: 'morning',
    name: '아침 루틴',
    description: '기상 후 15분 준비 루틴',
    color: ROUTINE_COLORS[2],
    icon: 'sunny-outline',
    repeatCount: 1,
    steps: [
      { title: '물 마시기', durationSec: 120 },
      { title: '스트레칭', durationSec: 300 },
      { title: '샤워 준비', durationSec: 300 },
      { title: '아침 식사', durationSec: 480 },
    ],
  },
  {
    id: 'workout',
    name: '운동 워밍업',
    description: '3세트 반복 워밍업',
    color: ROUTINE_COLORS[1],
    icon: 'barbell-outline',
    repeatCount: 3,
    steps: [
      { title: '가벼운 조깅', durationSec: 180 },
      { title: '동적 스트레칭', durationSec: 120 },
      { title: '휴식', durationSec: 60 },
    ],
  },
  {
    id: 'study',
    name: '집중 공부',
    description: '뽀모도로 25분 × 4세트',
    color: ROUTINE_COLORS[0],
    icon: 'book-outline',
    repeatCount: 4,
    steps: [
      { title: '집중 공부', durationSec: 1500 },
      { title: '짧은 휴식', durationSec: 300 },
    ],
  },
  {
    id: 'evening',
    name: '저녁 마무리',
    description: '하루를 정리하는 10분 루틴',
    color: ROUTINE_COLORS[4],
    icon: 'moon-outline',
    repeatCount: 1,
    steps: [
      { title: '내일 계획', durationSec: 180 },
      { title: '정리 정돈', durationSec: 180 },
      { title: '명상', durationSec: 240 },
    ],
  },
  {
    id: 'skincare',
    name: '스킨케어',
    description: '저녁 스킨케어 3단계',
    color: ROUTINE_COLORS[3],
    icon: 'sparkles-outline',
    repeatCount: 1,
    steps: [
      { title: '클렌징', durationSec: 120 },
      { title: '토너 & 세럼', durationSec: 90 },
      { title: '크림 & 마무리', durationSec: 90 },
    ],
  },
];
