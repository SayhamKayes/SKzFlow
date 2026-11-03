import React, { useState, useEffect, useMemo } from 'react';
import { 
  Project, 
  ServiceType, 
  ProjectStatus, 
  DateRangePreset,
  AuthUser 
} from './types/project';
import { 
  loadProjects, 
  saveProjects, 
  loadWorksheets,
  saveWorksheets,
  getCurrentMonthWorksheet,
  computeFinancials, 
  downloadProjectsCSV,
  loadAuthUser,
  clearAuthUser 
} from './utils/storage';
import { 
  getEffectiveWebhookUrl, 
  syncProjectsToGoogleSheets, 
  fetchProjectsFromGoogleSheets,
  SyncStatusInfo 
} from './utils/googleSheetsSync';
import { LoginScreen } from './components/LoginScreen';
import { Navbar } from './components/Navbar';
import { FilterAnalyticsModal } from './components/FilterAnalyticsModal';
import { MetricsOverview } from './components/MetricsOverview';
import { ServiceTypeFilter } from './components/ServiceTypeFilter';
import { ProjectTableView } from './components/ProjectTableView';
import { ProjectKanbanView } from './components/ProjectKanbanView';
import { ProjectCardsView } from './components/ProjectCardsView';
import { ProjectModal } from './components/ProjectModal';
import { ProjectDetailDrawer } from './components/ProjectDetailDrawer';
import { ProfileSettingsModal } from './components/ProfileSettingsModal';

export default function App() {
  // Authentication session
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => loadAuthUser());

  const [projects, setProjects] = useState<Project[]>(() => loadProjects());
  const [worksheets, setWorksheets] = useState<string[]>(() => loadWorksheets());
  
  // Worksheet and Range Filters - defaults to current running month (e.g. November 2026)
  const [selectedWorksheet, setSelectedWorksheet] = useState<string>(() => getCurrentMonthWorksheet());
  const [dateRange, setDateRange] = useState<DateRangePreset>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Service, Status & View Filtering
  const [selectedService, setSelectedService] = useState<ServiceType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'table' | 'kanban' | 'cards'>('table');

  // Modals & Drawers
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFilterAnalyticsOpen, setIsFilterAnalyticsOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [viewingProject, setViewingProject] = useState<Project | null>(null);

  // Live Google Sheets Auto-Sync Status
  const [syncStatus, setSyncStatus] = useState<SyncStatusInfo>(() => {
    const webhook = getEffectiveWebhookUrl();
    return { state: webhook ? 'synced' : 'not-configured' };
  });

  const [isRefreshingCloud, setIsRefreshingCloud] = useState(false);

  // Hydrate state from Central Google Sheets Cloud Database
  const loadCentralCloudData = async () => {
    const webhook = getEffectiveWebhookUrl();
    if (!webhook) return;

    setIsRefreshingCloud(true);
    try {
      const res = await fetchProjectsFromGoogleSheets(authUser);
      if (res.success && res.projects && res.projects.length > 0) {
        setProjects(res.projects);
        saveProjects(res.projects);
        if (res.worksheets && res.worksheets.length > 0) {
          setWorksheets(res.worksheets);
          saveWorksheets(res.worksheets);
        }
        setSyncStatus({
          state: 'synced',
          lastSyncedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      }
    } catch (err) {
      console.warn('Central database hydration notice:', err);
    } finally {
      setIsRefreshingCloud(false);
    }
  };

  // Pull latest records on mount & whenever switching back to this browser window
  useEffect(() => {
    loadCentralCloudData();

    const onFocus = () => loadCentralCloudData();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [authUser]);

  // Sync state to localStorage
  useEffect(() => {
    saveProjects(projects);
  }, [projects]);

  useEffect(() => {
    saveWorksheets(worksheets);
  }, [worksheets]);

  // Live Auto-Sync to Google Sheets whenever projects are updated
  useEffect(() => {
    const webhook = getEffectiveWebhookUrl();
    if (!webhook) {
      setSyncStatus({ state: 'not-configured' });
      return;
    }

    setSyncStatus(prev => ({ ...prev, state: 'syncing' }));
    const timer = setTimeout(async () => {
      const res = await syncProjectsToGoogleSheets(projects, authUser);
      if (res.success) {
        setSyncStatus({
          state: 'synced',
          lastSyncedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      } else {
        setSyncStatus({
          state: 'error',
          errorMessage: res.message
        });
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [projects, authUser]);

  const handleSignOut = () => {
    clearAuthUser();
    setAuthUser(null);
  };

  const handleAddWorksheet = (name: string) => {
    if (!worksheets.includes(name)) {
      const updated = [...worksheets, name];
      setWorksheets(updated);
      setSelectedWorksheet(name);
    } else {
      setSelectedWorksheet(name);
    }
  };

  const handleRenameWorksheet = (oldName: string, newName: string) => {
    if (!newName.trim() || oldName === newName) return;
    const updatedWorksheets = worksheets.map(ws => (ws === oldName ? newName : ws));
    setWorksheets(updatedWorksheets);

    // Update all projects assigned to the renamed worksheet
    setProjects(prev => prev.map(p => {
      if (p.worksheet === oldName) {
        return { ...p, worksheet: newName, updatedAt: new Date().toISOString() };
      }
      return p;
    }));

    if (selectedWorksheet === oldName) {
      setSelectedWorksheet(newName);
    }
  };

  const handleDeleteWorksheet = (nameToDelete: string) => {
    if (nameToDelete === 'All Worksheets') return;
    const updatedWorksheets = worksheets.filter(ws => ws !== nameToDelete);
    setWorksheets(updatedWorksheets);

    // Safely preserve and reassign projects from the deleted worksheet to another worksheet
    const fallbackWorksheet = updatedWorksheets.find(ws => ws !== 'All Worksheets') || getCurrentMonthWorksheet();
    setProjects(prev => prev.map(p => {
      if (p.worksheet === nameToDelete) {
        return { ...p, worksheet: fallbackWorksheet, updatedAt: new Date().toISOString() };
      }
      return p;
    }));

    if (selectedWorksheet === nameToDelete) {
      setSelectedWorksheet(fallbackWorksheet);
    }
  };

  // Check if project matches date range filter
  const isDateInRange = (project: Project, preset: DateRangePreset, start: string, end: string): boolean => {
    if (preset === 'all') return true;
    const dateStr = project.startDate || project.confirmationDate || project.createdAt;
    if (!dateStr) return true;
    const projectDate = new Date(dateStr);
    if (isNaN(projectDate.getTime())) return true;

    const now = new Date();

    if (preset === 'today') {
      return projectDate.toISOString().split('T')[0] === now.toISOString().split('T')[0];
    }

    if (preset === 'this-week') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return projectDate >= sevenDaysAgo;
    }

    if (preset === 'this-month') {
      return (
        projectDate.getFullYear() === now.getFullYear() &&
        projectDate.getMonth() === now.getMonth()
      );
    }

    if (preset === 'past-6-months') {
      const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
      return projectDate >= sixMonthsAgo;
    }

    if (preset === 'past-1-year') {
      const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      return projectDate >= oneYearAgo;
    }

    if (preset === 'custom') {
      if (start && projectDate < new Date(start)) return false;
      if (end && projectDate > new Date(end + 'T23:59:59Z')) return false;
      return true;
    }

    return true;
  };

  // Check if project matches worksheet filter
  const isWorksheetMatch = (project: Project, ws: string): boolean => {
    if (ws === 'All Worksheets') return true;
    if (ws === 'Untitled Worksheet') {
      return !project.worksheet || project.worksheet === 'Untitled Worksheet';
    }
    return project.worksheet === ws;
  };

  // 1. Projects filtered by Worksheet and Date Range (powers KPIs and service counts)
  const periodFilteredProjects = useMemo(() => {
    return projects.filter(p => {
      if (!isWorksheetMatch(p, selectedWorksheet)) return false;
      if (!isDateInRange(p, dateRange, customStartDate, customEndDate)) return false;
      return true;
    });
  }, [projects, selectedWorksheet, dateRange, customStartDate, customEndDate]);

  // Service count badges reflect current period
  const serviceCounts = useMemo(() => {
    const counts: Record<ServiceType | 'all', number> = {
      all: periodFilteredProjects.length,
      'web-app': 0,
      'ai-integration': 0,
      'saas-product': 0,
      'mobile-app': 0,
      'social-media-marketing': 0,
    };

    periodFilteredProjects.forEach(p => {
      if (counts[p.projectType] !== undefined) {
        counts[p.projectType]++;
      }
    });

    return counts;
  }, [periodFilteredProjects]);

  // 2. Further filtered by Service, Status, and Search query
  const filteredProjects = useMemo(() => {
    return periodFilteredProjects.filter(p => {
      // Service Type filter
      if (selectedService !== 'all' && p.projectType !== selectedService) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all' && p.projectStatus !== statusFilter) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchCompany = p.companyName?.toLowerCase().includes(query);
        const matchClient = p.clientsName?.toLowerCase().includes(query);
        const matchType = p.companyType?.toLowerCase().includes(query);
        const matchService = p.projectType?.toLowerCase().includes(query);
        const matchDeployment = p.deployment?.toLowerCase().includes(query);
        const matchPhone = p.clientPhone?.toLowerCase().includes(query);
        const matchEmail = p.clientEmail?.toLowerCase().includes(query);
        const matchNotes = p.notes?.toLowerCase().includes(query);

        if (!matchCompany && !matchClient && !matchType && !matchService && !matchDeployment && !matchPhone && !matchEmail && !matchNotes) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'budgetConfirmed') {
        comparison = (a.budgetConfirmed || 0) - (b.budgetConfirmed || 0);
      } else if (sortBy === 'dueAmount') {
        comparison = (a.dueAmount || 0) - (b.dueAmount || 0);
      } else if (sortBy === 'companyName') {
        comparison = (a.companyName || '').localeCompare(b.companyName || '');
      } else if (sortBy === 'progressPercent') {
        comparison = (a.progressPercent || 0) - (b.progressPercent || 0);
      } else {
        // Date sort
        const dateA = new Date(a.startDate || a.createdAt || 0).getTime();
        const dateB = new Date(b.startDate || b.createdAt || 0).getTime();
        comparison = dateA - dateB;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [periodFilteredProjects, selectedService, statusFilter, searchQuery, sortBy, sortDirection]);

  // Handlers
  const handleSaveProject = (project: Project) => {
    setProjects(prev => {
      const exists = prev.some(p => p.id === project.id);
      if (exists) {
        return prev.map(p => (p.id === project.id ? project : p));
      }
      return [project, ...prev];
    });

    if (viewingProject && viewingProject.id === project.id) {
      setViewingProject(project);
    }
  };

  const handleDeleteProject = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    if (viewingProject && viewingProject.id === projectId) {
      setViewingProject(null);
    }
  };

  const handleToggleMilestone = (
    projectId: string, 
    milestoneKey: 'advance40' | 'midway30' | 'handover30'
  ) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;

      const currentMilestone = p.milestones[milestoneKey];
      const willBePaid = !currentMilestone.paid;

      const updatedMilestones = {
        ...p.milestones,
        [milestoneKey]: {
          ...currentMilestone,
          paid: willBePaid,
          paidDate: willBePaid ? new Date().toISOString().split('T')[0] : undefined,
        }
      };

      const { totalPaid, dueAmount } = computeFinancials(p.budgetConfirmed, updatedMilestones);

      let updatedStatus = p.projectStatus;
      if (milestoneKey === 'handover30' && willBePaid) {
        updatedStatus = 'Completed';
      }

      const updatedProject = {
        ...p,
        milestones: updatedMilestones,
        totalPaid,
        dueAmount,
        projectStatus: updatedStatus,
        updatedAt: new Date().toISOString(),
      };

      if (viewingProject && viewingProject.id === projectId) {
        setViewingProject(updatedProject);
      }

      return updatedProject;
    }));
  };

  const handleQuickUpdateStatus = (projectId: string, newStatus: ProjectStatus) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      const updated = {
        ...p,
        projectStatus: newStatus,
        progressPercent: newStatus === 'Completed' ? 100 : newStatus === '70% Done' ? 70 : p.progressPercent,
        updatedAt: new Date().toISOString()
      };
      if (viewingProject && viewingProject.id === projectId) {
        setViewingProject(updated);
      }
      return updated;
    }));
  };

  const handleQuickUpdateConfirmation = (projectId: string, newConfirmation: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p;
      const updated = {
        ...p,
        confirmation: newConfirmation,
        updatedAt: new Date().toISOString()
      };
      if (viewingProject && viewingProject.id === projectId) {
        setViewingProject(updated);
      }
      return updated;
    }));
  };

  const timeframeLabel = useMemo(() => {
    if (dateRange === 'all') {
      return selectedWorksheet !== 'All Worksheets' ? selectedWorksheet : undefined;
    }
    const labels: Record<DateRangePreset, string> = {
      all: 'All Time',
      today: 'Today',
      'this-week': 'This Week',
      'this-month': 'This Month',
      'past-6-months': 'Past 6 Months',
      'past-1-year': 'Past 1 Year',
      custom: 'Custom Range',
    };
    return labels[dateRange];
  }, [dateRange, selectedWorksheet]);

  // If user is not authenticated, render LoginScreen gatekeeper
  if (!authUser) {
    return <LoginScreen onLoginSuccess={setAuthUser} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Top Navigation */}
      <Navbar
        onOpenFilterAnalytics={() => setIsFilterAnalyticsOpen(true)}
        activeWorksheet={selectedWorksheet}
        authUser={authUser}
        onOpenProfile={() => setIsProfileModalOpen(true)}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        
        {/* 1. KPI & Financial Overview (Dynamically computed for selected range/period) */}
        <MetricsOverview
          projects={periodFilteredProjects}
          timeframeLabel={timeframeLabel}
        />

        {/* 2. 5 Service Filters, View Modes & Search */}
        <ServiceTypeFilter
          selectedService={selectedService}
          onSelectService={setSelectedService}
          serviceCounts={serviceCounts}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          sortDirection={sortDirection}
          onToggleSortDirection={() => setSortDirection(d => d === 'asc' ? 'desc' : 'asc')}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {/* 3. View Switcher: Table / Kanban / Cards */}
        {viewMode === 'table' && (
          <ProjectTableView
            projects={filteredProjects}
            activeWorksheet={selectedWorksheet}
            worksheets={worksheets}
            onSelectWorksheet={setSelectedWorksheet}
            onAddWorksheet={handleAddWorksheet}
            onRefreshCloud={loadCentralCloudData}
            isRefreshingCloud={isRefreshingCloud}
            onDeleteWorksheet={handleDeleteWorksheet}
            onOpenNewProject={() => {
              setEditingProject(null);
              setIsModalOpen(true);
            }}
            onEditProject={(p) => {
              setEditingProject(p);
              setIsModalOpen(true);
            }}
            onViewProject={(p) => setViewingProject(p)}
            onDeleteProject={handleDeleteProject}
            onToggleMilestone={handleToggleMilestone}
            onQuickUpdateStatus={handleQuickUpdateStatus}
            onQuickUpdateConfirmation={handleQuickUpdateConfirmation}
          />
        )}

        {viewMode === 'kanban' && (
          <ProjectKanbanView
            projects={filteredProjects}
            onViewProject={(p) => setViewingProject(p)}
            onEditProject={(p) => {
              setEditingProject(p);
              setIsModalOpen(true);
            }}
            onQuickUpdateStatus={handleQuickUpdateStatus}
            onToggleMilestone={handleToggleMilestone}
          />
        )}

        {viewMode === 'cards' && (
          <ProjectCardsView
            projects={filteredProjects}
            onViewProject={(p) => setViewingProject(p)}
            onEditProject={(p) => {
              setEditingProject(p);
              setIsModalOpen(true);
            }}
            onDeleteProject={handleDeleteProject}
            onToggleMilestone={handleToggleMilestone}
          />
        )}

      </main>

      {/* Floating Add Project Action (Mobile Friendly) */}
      <div className="fixed bottom-5 right-5 sm:hidden z-30">
        <button
          onClick={() => {
            setEditingProject(null);
            setIsModalOpen(true);
          }}
          className="w-14 h-14 rounded-full bg-emerald-500 text-slate-950 font-bold shadow-2xl flex items-center justify-center text-3xl active:scale-95 cursor-pointer"
          title="Add New Project"
        >
          +
        </button>
      </div>

      {/* Add / Edit Project Modal */}
      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProject(null);
        }}
        onSave={handleSaveProject}
        initialProject={editingProject}
        worksheets={worksheets}
      />

      {/* Filter & Period Analytics Modal */}
      <FilterAnalyticsModal
        isOpen={isFilterAnalyticsOpen}
        onClose={() => setIsFilterAnalyticsOpen(false)}
        worksheets={worksheets}
        selectedWorksheet={selectedWorksheet}
        onSelectWorksheet={setSelectedWorksheet}
        onRenameWorksheet={handleRenameWorksheet}
        onDeleteWorksheet={handleDeleteWorksheet}
        dateRange={dateRange}
        onSelectDateRange={setDateRange}
        customStartDate={customStartDate}
        onCustomStartDateChange={setCustomStartDate}
        customEndDate={customEndDate}
        onCustomEndDateChange={setCustomEndDate}
        filteredProjects={periodFilteredProjects}
        totalAllProjects={projects.length}
      />

      {/* Project Detail Side Drawer */}
      <ProjectDetailDrawer
        project={viewingProject}
        isOpen={!!viewingProject}
        onClose={() => setViewingProject(null)}
        onEdit={(p) => {
          setEditingProject(p);
          setIsModalOpen(true);
        }}
        onDelete={handleDeleteProject}
        onToggleMilestone={handleToggleMilestone}
      />

      {/* Profile & Account Settings Modal (Includes Spreadsheet Tools & Sync) */}
      <ProfileSettingsModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        authUser={authUser}
        onSignOut={handleSignOut}
        projects={projects}
        syncStatus={syncStatus}
        onUpdateUser={setAuthUser}
      />

    </div>
  );
}
