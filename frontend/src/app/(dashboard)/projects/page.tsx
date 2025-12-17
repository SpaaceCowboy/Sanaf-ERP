'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { projectsApi } from '@/lib/api';
import type { Project, ProjectStatus, TaskPriority } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  cn,
  formatDate,
  getStatusColor,
  getPriorityBadgeColor,
  isOverdue,
} from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const statusOptions: { value: ProjectStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'NOT_STARTED', label: 'Not Started' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const priorityOptions: { value: TaskPriority | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All Priorities' },
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
];

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const { hasPermission } = useAuth();
  const overdue = project.dueDate && isOverdue(project.dueDate) && project.status !== 'COMPLETED';
  const totalTasks = project.tasks?.length || 0;
  const completedTasks = project.tasks?.filter((t) => t.status === 'COMPLETED').length || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="card-interactive h-full">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <Link href={`/projects/${project.id}`}>
                <h3 className="font-semibold text-lg truncate hover:text-electric-400 transition-colors">
                  {project.name}
                </h3>
              </Link>
              <p className="text-sm text-muted-foreground font-mono">
                {project.projectNumber}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/projects/${project.id}`}>
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Link>
                </DropdownMenuItem>
                {hasPermission('projects:write') && (
                  <DropdownMenuItem asChild>
                    <Link href={`/projects/${project.id}/edit`}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Link>
                  </DropdownMenuItem>
                )}
                {hasPermission('projects:delete') && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-danger-400">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {project.description && (
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {project.description}
            </p>
          )}

          <div className="flex items-center gap-2 mb-4">
            <Badge className={cn('text-xs', getStatusColor(project.status))}>
              {project.status.replace('_', ' ')}
            </Badge>
            <Badge
              variant="outline"
              className={cn('text-xs border', getPriorityBadgeColor(project.priority))}
            >
              {project.priority}
            </Badge>
            {overdue && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Overdue
              </Badge>
            )}
          </div>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-1.5" />
          </div>

          {/* Meta info */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {completedTasks}/{totalTasks} tasks
              </span>
              {project.dueDate && (
                <span className={cn('flex items-center gap-1', overdue && 'text-danger-400')}>
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(project.dueDate, 'MMM d')}
                </span>
              )}
            </div>
            {project.manager && (
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {project.manager.name}
              </span>
            )}
          </div>

          {/* Linked Order */}
          {project.order && (
            <div className="mt-4 pt-4 border-t border-border">
              <Link
                href={`/orders/${project.order.id}`}
                className="text-xs text-muted-foreground hover:text-electric-400"
              >
                Order: <span className="font-mono">{project.order.orderNumber}</span>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function ProjectsPage() {
  const { hasPermission } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'ALL'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'ALL'>('ALL');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['projects', { search, status: statusFilter, priority: priorityFilter, page }],
    queryFn: () =>
      projectsApi.list({
        search: search || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        priority: priorityFilter === 'ALL' ? undefined : priorityFilter,
        page,
        limit: 12,
      }),
  });

  const projects = data?.data || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

  // Stats
  const activeProjects = projects.filter((p) => p.status === 'IN_PROGRESS').length;
  const completedProjects = projects.filter((p) => p.status === 'COMPLETED').length;
  const overdueProjects = projects.filter(
    (p) => p.dueDate && isOverdue(p.dueDate) && p.status !== 'COMPLETED'
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1">
            Manage production projects and track tasks
          </p>
        </div>
        {hasPermission('projects:write') && (
          <Button asChild>
            <Link href="/projects/new">
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Link>
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-circuit-950/50">
              <Clock className="w-5 h-5 text-circuit-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeProjects}</p>
              <p className="text-xs text-muted-foreground">In Progress</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-electric-950/50">
              <CheckCircle2 className="w-5 h-5 text-electric-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{completedProjects}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-danger-950/50">
              <AlertTriangle className="w-5 h-5 text-danger-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{overdueProjects}</p>
              <p className="text-xs text-muted-foreground">Overdue</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-volt-950/50">
              <Users className="w-5 h-5 text-volt-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pagination.total}</p>
              <p className="text-xs text-muted-foreground">Total Projects</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={<Search className="w-4 h-4" />}
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as ProjectStatus | 'ALL')}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={priorityFilter}
              onValueChange={(value) => setPriorityFilter(value as TaskPriority | 'ALL')}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                {priorityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="space-y-4">
                  <div className="h-6 bg-muted/50 rounded animate-pulse" />
                  <div className="h-4 bg-muted/50 rounded animate-pulse w-3/4" />
                  <div className="h-20 bg-muted/50 rounded animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No projects found</p>
            {hasPermission('projects:write') && (
              <Button asChild className="mt-4">
                <Link href="/projects/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Project
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project, index) => (
              <ProjectCard key={project.id} project={project} index={index} />
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page === pagination.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
