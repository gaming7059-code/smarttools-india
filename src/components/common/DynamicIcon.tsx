import React from 'react'
import {
  Percent,
  Calendar,
  Landmark,
  Receipt,
  Tag,
  TrendingUp,
  IndianRupee,
  Clock,
  ArrowLeftRight,
  FileText,
  Calculator,
  GraduationCap,
  Video,
  Zap,
  ShieldCheck,
  Gift,
  Smartphone,
  Search,
  Menu,
  X,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Layers,
  HelpCircle,
  CheckCircle2,
  FileEdit,
  type LucideProps
} from 'lucide-react'

const iconMap: Record<string, React.ComponentType<LucideProps>> = {
  Percent,
  Calendar,
  Landmark,
  Receipt,
  Tag,
  TrendingUp,
  IndianRupee,
  Clock,
  ArrowLeftRight,
  FileText,
  Calculator,
  GraduationCap,
  Video,
  Zap,
  ShieldCheck,
  Gift,
  Smartphone,
  Search,
  Menu,
  X,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Layers,
  HelpCircle,
  CheckCircle2,
  FileEdit,
}

interface DynamicIconProps extends LucideProps {
  name: string
}

export const DynamicIcon: React.FC<DynamicIconProps> = ({ name, ...props }) => {
  const IconComponent = iconMap[name] || HelpCircle
  return <IconComponent {...props} />
}
