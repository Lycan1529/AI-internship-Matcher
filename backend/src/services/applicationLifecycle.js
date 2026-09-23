export const applicationTransitions = Object.freeze({
  Applied: new Set(["Applied", "Interview", "Rejected"]),
  Interview: new Set(["Interview", "Offer", "Rejected"]),
  Offer: new Set(["Offer"]),
  Rejected: new Set(["Rejected"]),
});

export function canTransitionApplication(from, to) {
  return applicationTransitions[from]?.has(to) || false;
}
