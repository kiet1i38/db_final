import React from 'react';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Divider,
  Drawer,
  Fab,
  IconButton,
  InputBase,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded';
import QuizRoundedIcon from '@mui/icons-material/QuizRounded';
import AnalyticsRoundedIcon from '@mui/icons-material/AnalyticsRounded';
import AccountTreeRoundedIcon from '@mui/icons-material/AccountTreeRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { USER_ROLES } from '../utils/constants';

const drawerWidth = 296;
const contentMaxWidth = 1360;

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactElement;
  isActive: (pathname: string, view: string | null) => boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const getStudentGroups = (): NavGroup[] => [
  {
    title: 'Learning',
    items: [
      {
        label: 'Dashboard',
        path: '/student/dashboard',
        icon: <DashboardRoundedIcon />,
        isActive: (pathname, view) => pathname === '/student/dashboard' && !view,
      },
      {
        label: 'Sections',
        path: '/student/dashboard?view=sections',
        icon: <SchoolRoundedIcon />,
        isActive: (pathname, view) => pathname === '/student/dashboard' && view === 'sections',
      },
      {
        label: 'Quizzes',
        path: '/student/dashboard?view=quizzes',
        icon: <QuizRoundedIcon />,
        isActive: (pathname, view) =>
          pathname.startsWith('/student/quiz/') ||
          (pathname.startsWith('/student/sections/') && !pathname.endsWith('/analytics')) ||
          (pathname === '/student/dashboard' && view === 'quizzes'),
      },
      {
        label: 'Analytics',
        path: '/student/dashboard?view=analytics',
        icon: <AnalyticsRoundedIcon />,
        isActive: (pathname, view) =>
          pathname.endsWith('/analytics') ||
          pathname.includes('/results') ||
          (pathname === '/student/dashboard' && view === 'analytics'),
      },
    ],
  },
];

const getTeacherGroups = (): NavGroup[] => [
  {
    title: 'Teaching',
    items: [
      {
        label: 'Dashboard',
        path: '/teacher/dashboard',
        icon: <DashboardRoundedIcon />,
        isActive: (pathname, view) => pathname === '/teacher/dashboard' && !view,
      },
      {
        label: 'Sections',
        path: '/teacher/dashboard?view=sections',
        icon: <SchoolRoundedIcon />,
        isActive: (pathname, view) =>
          (pathname.startsWith('/teacher/sections/') && !pathname.endsWith('/analytics')) ||
          (pathname === '/teacher/dashboard' && view === 'sections'),
      },
      {
        label: 'Quizzes',
        path: '/teacher/dashboard?view=quizzes',
        icon: <QuizRoundedIcon />,
        isActive: (pathname, view) =>
          pathname.startsWith('/teacher/quiz/') ||
          (pathname === '/teacher/dashboard' && view === 'quizzes'),
      },
      {
        label: 'Analytics',
        path: '/teacher/dashboard?view=analytics',
        icon: <AnalyticsRoundedIcon />,
        isActive: (pathname, view) =>
          pathname.endsWith('/analytics') ||
          (pathname === '/teacher/dashboard' && view === 'analytics'),
      },
    ],
  },
];

const getAdminGroups = (): NavGroup[] => [
  {
    title: 'Control',
    items: [
      {
        label: 'Overview',
        path: '/admin/dashboard',
        icon: <DashboardRoundedIcon />,
        isActive: (pathname, view) =>
          pathname === '/admin/dashboard' && (!view || view === 'overview'),
      },
      {
        label: 'Hierarchy',
        path: '/admin/dashboard?view=report',
        icon: <AccountTreeRoundedIcon />,
        isActive: (pathname, view) => pathname === '/admin/dashboard' && view === 'report',
      },
      {
        label: 'Performance',
        path: '/admin/dashboard?view=performance',
        icon: <InsightsRoundedIcon />,
        isActive: (pathname, view) => pathname === '/admin/dashboard' && view === 'performance',
      },
    ],
  },
];

const getNavGroups = (role?: string): NavGroup[] => {
  if (role === USER_ROLES.ADMIN) return getAdminGroups();
  if (role === USER_ROLES.TEACHER) return getTeacherGroups();
  return getStudentGroups();
};

const getSearchPlaceholder = (role?: string) => {
  if (role === USER_ROLES.ADMIN) return 'Search hierarchy, metrics, or reports...';
  if (role === USER_ROLES.TEACHER) return 'Search sections, quizzes, or student insights...';
  return 'Search sections, quizzes, or results...';
};

const formatRoleLabel = (role?: string) => {
  if (!role) return 'User';
  return role.charAt(0) + role.slice(1).toLowerCase();
};

const getUserInitial = (label?: string) => {
  const source = label?.trim();
  if (!source) return 'U';
  return source.charAt(0).toUpperCase();
};

export default function PageShell({
  children,
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, logout } = useAuth();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const homePath =
    state.user?.role === USER_ROLES.ADMIN
      ? '/admin/dashboard'
      : state.user?.role === USER_ROLES.TEACHER
        ? '/teacher/dashboard'
        : '/student/dashboard';
  const currentView = new URLSearchParams(location.search).get('view');
  const displayName = state.user?.fullName || state.user?.email || 'User';
  const roleLabel = formatRoleLabel(state.user?.role);

  const handleSignOut = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    if (!isDesktop) setMobileOpen(false);
  };

  const handleMenuToggle = () => setMobileOpen((prev) => !prev);

  const handleTutorClick = () => {
    window.dispatchEvent(
      new CustomEvent('notification:show', {
        detail: {
          message: 'AI Tutor and Quick Notes are the next upgrade in this workspace.',
          type: 'info',
        },
      })
    );
  };

  const drawerContent = (
    <Stack
      spacing={3}
      sx={{
        height: '100%',
        px: 2.25,
        py: 2.5,
        bgcolor: 'var(--ceramic)',
        backgroundImage: `linear-gradient(180deg, ${alpha('#ffffff', 0.55)} 0%, transparent 42%)`,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 1,
          py: 1,
          cursor: 'pointer',
          borderRadius: 4,
        }}
        onClick={() => handleNavigate(homePath)}
      >
        <Box
          sx={{
            width: 46,
            height: 46,
            borderRadius: 3,
            bgcolor: 'var(--academy-green)',
            color: '#fff',
            display: 'grid',
            placeItems: 'center',
            fontWeight: 800,
            boxShadow: '0 10px 18px rgba(0, 98, 65, 0.2)',
          }}
        >
          E
        </Box>
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontFamily: 'var(--font-serif)',
              fontWeight: 600,
              lineHeight: 1.05,
              color: 'var(--deep-slate)',
            }}
          >
            E-Learning
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Warm academic workspace
          </Typography>
        </Box>
      </Box>

      <Paper
        sx={{
          p: 2,
          borderRadius: 4,
          bgcolor: alpha('#ffffff', 0.72),
          border: `1px solid ${alpha('#1E3932', 0.08)}`,
          boxShadow: 'none',
        }}
      >
        <Stack spacing={0.9}>
          <Typography variant="overline" sx={{ color: 'var(--academy-green)' }}>
            Daily focus
          </Typography>
          <Typography
            variant="h6"
            sx={{
              fontFamily: 'var(--font-serif)',
              color: 'var(--deep-slate)',
            }}
          >
            Move one lesson forward today.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This workspace is designed to stay calm, readable, and encouraging during long study sessions.
          </Typography>
        </Stack>
      </Paper>

      {getNavGroups(state.user?.role).map((group, index) => (
        <Box key={group.title}>
          {index > 0 && <Divider sx={{ mb: 2, borderColor: alpha('#1E3932', 0.08) }} />}
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ px: 1.5, letterSpacing: 1.4 }}
          >
            {group.title}
          </Typography>
          <List disablePadding sx={{ mt: 1 }}>
            {group.items.map((item) => {
              const active = item.isActive(location.pathname, currentView);

              return (
                <ListItemButton
                  key={item.label}
                  onClick={() => handleNavigate(item.path)}
                  sx={{
                    borderRadius: 999,
                    mb: 0.75,
                    minHeight: 52,
                    px: 1.5,
                    bgcolor: active ? alpha('#ffffff', 0.9) : 'transparent',
                    border: active ? `1px solid ${alpha('#00754A', 0.18)}` : '1px solid transparent',
                    color: active ? 'var(--academy-green)' : 'var(--deep-slate)',
                    boxShadow: active ? '0 8px 16px rgba(0, 0, 0, 0.06)' : 'none',
                    '&:hover': {
                      bgcolor: active ? alpha('#ffffff', 0.96) : alpha('#ffffff', 0.55),
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 40,
                      color: active ? 'var(--action-green)' : alpha('#1E3932', 0.72),
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontWeight: active ? 700 : 600,
                    }}
                  />
                </ListItemButton>
              );
            })}
          </List>
        </Box>
      ))}

      <Box sx={{ mt: 'auto' }}>
        <Paper
          sx={{
            p: 2.25,
            borderRadius: 4,
            bgcolor: 'var(--deep-slate)',
            color: 'var(--text-white)',
            boxShadow: 'none',
          }}
        >
          <Stack spacing={1.25}>
            <Typography
              sx={{
                fontFamily: 'var(--font-script)',
                fontSize: '1.15rem',
                color: alpha('#ffffff', 0.9),
              }}
            >
              Need a hand?
            </Typography>
            <Typography variant="body2" sx={{ color: 'var(--text-white-soft)' }}>
              Check notifications, review your recent activity, or sign out when you are done.
            </Typography>
            <Button fullWidth variant="contained" onClick={handleSignOut}>
              Sign out
            </Button>
          </Stack>
        </Paper>
      </Box>
    </Stack>
  );

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        bgcolor: 'var(--paper-neutral)',
        backgroundImage:
          'radial-gradient(circle at top right, rgba(223,196,157,0.22), transparent 26%), radial-gradient(circle at bottom left, rgba(212,233,226,0.58), transparent 30%)',
      }}
    >
      <Drawer
        variant={isDesktop ? 'permanent' : 'temporary'}
        open={isDesktop ? true : mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRight: `1px solid ${alpha('#1E3932', 0.08)}`,
            backgroundColor: 'var(--ceramic)',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: alpha('#f2f0eb', 0.88),
            backdropFilter: 'blur(18px)',
            color: 'text.primary',
            borderBottom: `1px solid ${alpha('#1E3932', 0.08)}`,
          }}
        >
          <Toolbar sx={{ minHeight: { xs: 78, md: 88 } }}>
            <Box
              sx={{
                width: '100%',
                maxWidth: contentMaxWidth,
                mx: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              {!isDesktop && (
                <IconButton
                  onClick={handleMenuToggle}
                  sx={{
                    bgcolor: alpha('#ffffff', 0.9),
                    border: `1px solid ${alpha('#1E3932', 0.08)}`,
                  }}
                >
                  <MenuRoundedIcon />
                </IconButton>
              )}

              <Paper
                sx={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  px: 2,
                  py: 1.1,
                  borderRadius: 999,
                  boxShadow: 'none',
                  bgcolor: alpha('#ffffff', 0.72),
                  border: `1px solid ${alpha('#1E3932', 0.08)}`,
                }}
              >
                <SearchRoundedIcon sx={{ color: alpha('#1E3932', 0.55), mr: 1 }} />
                <InputBase
                  placeholder={getSearchPlaceholder(state.user?.role)}
                  sx={{ flex: 1 }}
                />
              </Paper>

              {actionLabel && onAction && (
                <Button
                  startIcon={<AddRoundedIcon />}
                  variant="contained"
                  onClick={onAction}
                  sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
                >
                  {actionLabel}
                </Button>
              )}

              <IconButton
                sx={{
                  display: { xs: 'none', sm: 'inline-flex' },
                  bgcolor: alpha('#ffffff', 0.75),
                  border: `1px solid ${alpha('#1E3932', 0.08)}`,
                }}
              >
                <NotificationsNoneRoundedIcon />
              </IconButton>

              <Paper
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.25,
                  px: 1.2,
                  py: 0.8,
                  borderRadius: 999,
                  boxShadow: 'none',
                  bgcolor: alpha('#ffffff', 0.76),
                  border: `1px solid ${alpha('#1E3932', 0.08)}`,
                }}
              >
                <Box sx={{ textAlign: 'right', display: { xs: 'none', md: 'block' } }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                      maxWidth: 170,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {displayName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {roleLabel}
                  </Typography>
                </Box>
                <Avatar
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: 'var(--academy-green)',
                  }}
                >
                  {getUserInitial(displayName)}
                </Avatar>
              </Paper>
            </Box>
          </Toolbar>
        </AppBar>

        <Box sx={{ px: { xs: 2, md: 3 }, py: { xs: 2.5, md: 3 } }}>
          <Box sx={{ maxWidth: contentMaxWidth, mx: 'auto' }}>
            {(title || subtitle || (actionLabel && onAction)) && (
              <Box
                sx={{
                  mb: 3,
                  display: 'flex',
                  alignItems: { xs: 'flex-start', sm: 'flex-end' },
                  justifyContent: 'space-between',
                  gap: 2,
                  flexWrap: 'wrap',
                }}
              >
                <Box>
                  {title && (
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'var(--deep-slate)' }}>
                      {title}
                    </Typography>
                  )}
                  {subtitle && (
                    <Typography variant="body2" color="text.secondary">
                      {subtitle}
                    </Typography>
                  )}
                </Box>

                {actionLabel && onAction && (
                  <Button
                    startIcon={<AddRoundedIcon />}
                    variant="contained"
                    onClick={onAction}
                    sx={{ display: { xs: 'inline-flex', sm: 'none' } }}
                  >
                    {actionLabel}
                  </Button>
                )}
              </Box>
            )}

            {children}
          </Box>
        </Box>
      </Box>

      <Tooltip title="AI Tutor / Quick Notes">
        <Fab
          aria-label="AI Tutor and Quick Notes"
          onClick={handleTutorClick}
          sx={{
            position: 'fixed',
            right: { xs: 16, md: 28 },
            bottom: { xs: 16, md: 28 },
            zIndex: theme.zIndex.snackbar,
          }}
        >
          <AutoAwesomeRoundedIcon />
        </Fab>
      </Tooltip>
    </Box>
  );
}
