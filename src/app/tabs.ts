import { CheckSquare, Fuel, Home, Menu, Route } from 'lucide-react';
import type { TabItem } from '../types/navigation';

export const tabs: TabItem[] = [
  { id: 'home', label: 'Início', icon: Home },
  { id: 'fuel', label: 'Abastecer', icon: Fuel },
  { id: 'trip', label: 'Viagem', icon: Route },
  { id: 'checklist', label: 'Checklist', icon: CheckSquare },
  { id: 'more', label: 'Mais', icon: Menu },
];
