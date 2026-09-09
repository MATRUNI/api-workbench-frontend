import { icons, FileText } from 'lucide-react';

export const DynamicIcon = ({ name, size = 18 }) => {

  const IconComponent = icons[name] || FileText;
  
  return <IconComponent size={size} />;
};