import type { ComponentProps } from 'react';
import type Ionicons from '@expo/vector-icons/Ionicons';

export type AppIconName = ComponentProps<typeof Ionicons>['name'];

export const DEFAULT_ROUTINE_ICON: AppIconName = 'timer-outline';
export const DEFAULT_TEMPLATE_ICON: AppIconName = 'bookmark-outline';

/** 템플릿/루틴에서 고를 수 있는 아이콘 후보 */
export const PICKABLE_ICONS: AppIconName[] = [
  // 기본 · 시간
  'bookmark-outline',
  'timer-outline',
  'alarm-outline',
  'stopwatch-outline',
  'hourglass-outline',
  'time-outline',
  'calendar-outline',
  'today-outline',
  // 아침 · 밤 · 날씨
  'sunny-outline',
  'partly-sunny-outline',
  'moon-outline',
  'cloudy-outline',
  'rainy-outline',
  'thunderstorm-outline',
  'snow-outline',
  'umbrella-outline',
  // 운동 · 활동
  'barbell-outline',
  'fitness-outline',
  'walk-outline',
  'bicycle-outline',
  'basketball-outline',
  'football-outline',
  'tennisball-outline',
  'body-outline',
  'pulse-outline',
  'footsteps-outline',
  // 학습 · 업무
  'book-outline',
  'library-outline',
  'school-outline',
  'pencil-outline',
  'create-outline',
  'document-text-outline',
  'clipboard-outline',
  'briefcase-outline',
  'laptop-outline',
  'desktop-outline',
  'mail-outline',
  'bulb-outline',
  'glasses-outline',
  'code-slash-outline',
  // 마음 · 건강
  'heart-outline',
  'happy-outline',
  'sparkles-outline',
  'flower-outline',
  'leaf-outline',
  'medkit-outline',
  'hand-left-outline',
  'eye-outline',
  'ear-outline',
  // 생활 · 집
  'home-outline',
  'bed-outline',
  'cafe-outline',
  'restaurant-outline',
  'nutrition-outline',
  'water-outline',
  'shirt-outline',
  'basket-outline',
  'cart-outline',
  'gift-outline',
  'paw-outline',
  'fish-outline',
  // 미디어 · 취미
  'musical-notes-outline',
  'headset-outline',
  'brush-outline',
  'color-palette-outline',
  'camera-outline',
  'film-outline',
  'game-controller-outline',
  'dice-outline',
  // 이동 · 장소
  'car-outline',
  'bus-outline',
  'train-outline',
  'airplane-outline',
  'boat-outline',
  'map-outline',
  'navigate-outline',
  'compass-outline',
  'location-outline',
  // 동기 · 목표
  'flame-outline',
  'flash-outline',
  'rocket-outline',
  'trophy-outline',
  'medal-outline',
  'flag-outline',
  'star-outline',
  'diamond-outline',
  'ribbon-outline',
  'checkmark-circle-outline',
  'infinite-outline',
  'people-outline',
  'person-outline',
  'chatbubbles-outline',
  'notifications-outline',
  'phone-portrait-outline',
];

export function resolveAppIcon(
  name: string | undefined | null,
  fallback: AppIconName = DEFAULT_ROUTINE_ICON
): AppIconName {
  if (!name) return fallback;
  return name as AppIconName;
}
