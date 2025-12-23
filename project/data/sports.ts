export interface Sport {
  id: string;
  label: string;
  iconName: string;
}

export const sports: Sport[] = [
  {
    id: "football",
    label: "Football",
    iconName: "sports-soccer",
  },
  {
    id: "basketball",
    label: "Basketball",
    iconName: "sports-basketball",
  },
];
