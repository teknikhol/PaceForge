import { RunData } from './history-storage';

export interface DynamicInsight {
  title: string;
  message: string;
  icon: string;
}

export function getDynamicMotivation(
  userName: string,
  history: RunData[],
  streak: number
): DynamicInsight {
  const name = userName.split(' ')[0] || 'Runner';

  // 1. New User / No History
  if (history.length === 0) {
    return {
      title: "The Anvil is Cold",
      message: `Welcome, ${name}. Your running legacy begins with the first strike. Ready to heat up the forge?`,
      icon: "hammer-outline",
    };
  }

  // 2. High Streak
  if (streak >= 3) {
    return {
      title: "The Fire is Burning",
      message: `${streak} days of consistent strikes! You're forging something unbreakable. Keep the momentum, ${name}!`,
      icon: "flame-outline",
    };
  }

  const lastRun = history[0];
  const totalDistance = history.reduce((sum, run) => sum + run.distanceMeters, 0);
  const totalKm = (totalDistance / 1000).toFixed(1);

  // 3. Milestone Achievement
  if (history.length % 5 === 0) {
    return {
      title: "Master Blacksmith",
      message: `${history.length} runs completed! You've forged ${totalKm}km of progress. Every mile is a masterpiece.`,
      icon: "trophy-outline",
    };
  }

  // 4. Effort Acknowledgment (Last Run)
  if (lastRun.distanceMeters > 5000) {
    return {
      title: "Forged in Endurance",
      message: `That last 5K+ was a massive strike, ${name}. Your spirit is becoming as tough as iron.`,
      icon: "fitness-outline",
    };
  }

  // 5. General Encouragement (Default)
  const generalMessages = [
    "Every mile is a strike on the anvil of progress. Keep swinging the hammer!",
    "Progress is forged in the miles no one sees. Get after it today.",
    "Your legacy isn't built in a day, but it is built every day you show up.",
    "The forge doesn't rest, and neither does your potential. Ready for another mile?",
  ];
  
  const randomMessage = generalMessages[Math.floor(Math.random() * generalMessages.length)];

  return {
    title: "Forge Ahead",
    message: randomMessage,
    icon: "sparkles-outline",
  };
}