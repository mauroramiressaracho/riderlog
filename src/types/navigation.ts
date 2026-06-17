export type TabId = 'home' | 'fuel' | 'trip' | 'checklist' | 'more';

export type TabItem = {
  id: TabId;
  label: string;
  icon: string;
};
