import React from 'react';
import { 
  ServiceType, 
  SERVICE_DEFINITIONS, 
  ProjectStatus 
} from '../types/project';
import { 
  Search, 
  Table, 
  Kanban, 
  LayoutGrid, 
  X,
  Globe,
  Cpu,
  Layers,
  Smartphone,
  Share2,
  ArrowUpDown
} from 'lucide-react';

interface ServiceTypeFilterProps {
  selectedService: ServiceType | 'all';
  onSelectService: (service: ServiceType | 'all') => void;
  serviceCounts: Record<ServiceType | 'all', number>;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: ProjectStatus | 'all';
  onStatusFilterChange: (status: ProjectStatus | 'all') => void;
  sortBy: string;
  onSortByChange: (sort: string) => void;
  sortDirection: 'asc' | 'desc';
  onToggleSortDirection: () => void;
  viewMode: 'table' | 'kanban' | 'cards';
  onViewModeChange: (mode: 'table' | 'kanban' | 'cards') => void;
}

const getServiceIcon = (iconName: string) => {
  switch (iconName) {
    case 'Globe': return <Globe className="w-3.5 h-3.5" />;
    case 'Cpu': return <Cpu className="w-3.5 h-3.5" />;
    case 'Layers': return <Layers className="w-3.5 h-3.5" />;
    case 'Smartphone': return <Smartphone className="w-3.5 h-3.5" />;
    case 'Share2': return <Share2 className="w-3.5 h-3.5" />;
    default: return <Globe className="w-3.5 h-3.5" />;
  }
};

export const ServiceTypeFilter: React.FC<ServiceTypeFilterProps> = ({
  selectedService,
  onSelectService,
  serviceCounts,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortByChange,
  sortDirection,
  onToggleSortDirection,
  viewMode,
  onViewModeChange
}) => {
  const services: { id: ServiceType; label: string; count: number; icon: React.ReactNode }[] = [
    {
      id: 'web-app',
      label: SERVICE_DEFINITIONS['web-app'].label,
      count: serviceCounts['web-app'] || 0,
      icon: getServiceIcon(SERVICE_DEFINITIONS['web-app'].iconName),
    },
    {
      id: 'ai-integration',
      label: SERVICE_DEFINITIONS['ai-integration'].label,
      count: serviceCounts['ai-integration'] || 0,
      icon: getServiceIcon(SERVICE_DEFINITIONS['ai-integration'].iconName),
    },
    {
      id: 'saas-product',
      label: SERVICE_DEFINITIONS['saas-product'].label,
      count: serviceCounts['saas-product'] || 0,
      icon: getServiceIcon(SERVICE_DEFINITIONS['saas-product'].iconName),
    },
    {
      id: 'mobile-app',
      label: SERVICE_DEFINITIONS['mobile-app'].label,
      count: serviceCounts['mobile-app'] || 0,
      icon: getServiceIcon(SERVICE_DEFINITIONS['mobile-app'].iconName),
    },
    {
      id: 'social-media-marketing',
      label: SERVICE_DEFINITIONS['social-media-marketing'].label,
      count: serviceCounts['social-media-marketing'] || 0,
      icon: getServiceIcon(SERVICE_DEFINITIONS['social-media-marketing'].iconName),
    },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4 mb-5 shadow-sm">
      
      {/* 5 Main Service Tabs with Count badges */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
          
          {/* ALL tab */}
          <button
            onClick={() => onSelectService('all')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              selectedService === 'all'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <span>All Services</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              selectedService === 'all' 
                ? 'bg-slate-950/30 text-slate-950 font-extrabold' 
                : 'bg-slate-700 text-slate-300'
            }`}>
              {serviceCounts['all'] || 0}
            </span>
          </button>

          {/* 5 Service Specific Tabs */}
          {services.map(s => {
            const isSelected = selectedService === s.id;
            return (
              <button
                key={s.id}
                onClick={() => onSelectService(s.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span>{s.icon}</span>
                <span>{s.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isSelected 
                    ? 'bg-emerald-950 text-emerald-200 font-bold' 
                    : 'bg-slate-700 text-slate-400'
                }`}>
                  {s.count}
                </span>
              </button>
            );
          })}

        </div>

        {/* View Mode Toggle: Spreadsheet Table vs Board vs Grid */}
        <div className="flex items-center space-x-1 bg-slate-800/80 p-0.5 rounded-lg border border-slate-700">
          <button
            onClick={() => onViewModeChange('table')}
            className={`p-1.5 rounded-md text-xs font-medium flex items-center space-x-1 transition cursor-pointer ${
              viewMode === 'table'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Spreadsheet Table View"
          >
            <Table className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px] font-semibold">Sheet Table</span>
          </button>

          <button
            onClick={() => onViewModeChange('kanban')}
            className={`p-1.5 rounded-md text-xs font-medium flex items-center space-x-1 transition cursor-pointer ${
              viewMode === 'kanban'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Kanban Board View"
          >
            <Kanban className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px] font-semibold">Board</span>
          </button>

          <button
            onClick={() => onViewModeChange('cards')}
            className={`p-1.5 rounded-md text-xs font-medium flex items-center space-x-1 transition cursor-pointer ${
              viewMode === 'cards'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Cards Grid View"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px] font-semibold">Cards</span>
          </button>
        </div>

      </div>

      {/* Search, Filter Status, and Sorting Bar */}
      <div className="pt-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
        
        {/* Search Field */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search company, client, service or deployment..."
            className="w-full pl-9 pr-8 py-1.5 text-xs sm:text-sm bg-slate-800/80 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Controls Group */}
        <div className="flex items-center space-x-2 flex-wrap sm:flex-nowrap">
          
          {/* Status Filter */}
          <div className="flex items-center space-x-1">
            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
              Status:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value as ProjectStatus | 'all')}
              className="text-xs bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">All Statuses</option>
              <option value="Lead">Lead</option>
              <option value="Confirmed">Confirmed</option>
              <option value="In Progress">In Progress</option>
              <option value="70% Done">70% Done</option>
              <option value="Review / QA">Review / QA</option>
              <option value="Completed">Completed</option>
              <option value="On Hold">On Hold</option>
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center space-x-1">
            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
              Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value)}
              className="text-xs bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="date">Date Added</option>
              <option value="budgetConfirmed">Budget</option>
              <option value="dueAmount">Due Amount</option>
              <option value="companyName">Company Name</option>
              <option value="progressPercent">Progress %</option>
            </select>

            {/* Sort Asc/Desc button */}
            <button
              onClick={onToggleSortDirection}
              className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 transition cursor-pointer"
              title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
