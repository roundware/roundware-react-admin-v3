import {
  Add,
  Delete,
  PersonRemove,
  Send,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  IconButton,
  MenuItem,
  Select,
  SelectChangeEvent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useCallback, useEffect, useState } from "react";
import { usePermissions, Title } from "react-admin";
import { apiFetcher } from "../roundwareDataProvider/tokenAuthProvider";

interface Member {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  project_ids: number[] | null;
}

interface ProjectInfo {
  id: number;
  name: string;
}

interface Invitation {
  id: number;
  email: string;
  role: string;
  created_at: string;
  expires_at: string;
  accepted: boolean;
  invited_by_email: string;
}

const ROLES = ["owner", "admin", "editor", "viewer"];

const TeamMembersPage = (): JSX.Element => {
  const { permissions } = usePermissions();
  const canManage = ["owner", "admin", "superuser"].includes(permissions?.role);

  const [members, setMembers] = useState<Member[]>([]);
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [expandedMember, setExpandedMember] = useState<number | null>(null);

  const loadMembers = useCallback(async () => {
    try {
      const { json } = await apiFetcher("/users/");
      setMembers(json as unknown as Member[]);
    } catch {
      setError("Failed to load members.");
    }
  }, []);

  const loadProjects = useCallback(async () => {
    try {
      const { json } = await apiFetcher("/projects/");
      setProjects(json as unknown as ProjectInfo[]);
    } catch {
      // Projects may not be available
    }
  }, []);

  const loadInvitations = useCallback(async () => {
    if (!canManage) return;
    try {
      const { json } = await apiFetcher("/invitations/");
      setInvitations(json as unknown as Invitation[]);
    } catch {
      // Invitations may not be available for non-admin
    }
  }, [canManage]);

  useEffect(() => {
    loadMembers();
    loadProjects();
    loadInvitations();
  }, [loadMembers, loadProjects, loadInvitations]);

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await apiFetcher(`/users/${userId}/`, {
        method: "PATCH",
        body: JSON.stringify({ role: newRole }),
        headers: new Headers({ "Content-Type": "application/json" }),
      });
      setError(null);
      loadMembers();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to change role.";
      setError(msg);
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!window.confirm("Are you sure you want to remove this member?")) return;
    try {
      await apiFetcher(`/users/${userId}/`, { method: "DELETE" });
      setError(null);
      loadMembers();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to remove member.";
      setError(msg);
    }
  };

  const handleProjectToggle = async (
    userId: number,
    projectId: number,
    currentIds: number[] | null
  ) => {
    const current = currentIds ?? [];
    const newIds = current.includes(projectId)
      ? current.filter((id) => id !== projectId)
      : [...current, projectId];

    try {
      await apiFetcher(`/users/${userId}/`, {
        method: "PATCH",
        body: JSON.stringify({ project_ids: newIds }),
        headers: new Headers({ "Content-Type": "application/json" }),
      });
      setError(null);
      loadMembers();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to update project access.";
      setError(msg);
    }
  };

  const handleClearProjectAccess = async (userId: number) => {
    try {
      await apiFetcher(`/users/${userId}/`, {
        method: "PATCH",
        body: JSON.stringify({ project_ids: [] }),
        headers: new Headers({ "Content-Type": "application/json" }),
      });
      setError(null);
      loadMembers();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to clear project access.";
      setError(msg);
    }
  };

  const handleSendInvite = async () => {
    setInviteError(null);
    try {
      await apiFetcher("/invitations/", {
        method: "POST",
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
        headers: new Headers({ "Content-Type": "application/json" }),
      });
      setInviteOpen(false);
      setInviteEmail("");
      setInviteRole("viewer");
      loadInvitations();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to send invitation.";
      setInviteError(msg);
    }
  };

  const handleRevokeInvite = async (invitationId: number) => {
    try {
      await apiFetcher(`/invitations/${invitationId}/`, { method: "DELETE" });
      loadInvitations();
    } catch {
      setError("Failed to revoke invitation.");
    }
  };

  const isRestrictableRole = (role: string) =>
    role === "editor" || role === "viewer";

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", mt: 2 }}>
      <Title title="Team Members" />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Members */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title="Members"
          action={
            canManage ? (
              <Button
                startIcon={<Add />}
                variant="contained"
                size="small"
                onClick={() => setInviteOpen(true)}
              >
                Invite Member
              </Button>
            ) : undefined
          }
        />
        <CardContent sx={{ p: 0 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Project Access</TableCell>
                {canManage && <TableCell align="right">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {members.map((m) => (
                <React.Fragment key={m.id}>
                  <TableRow>
                    <TableCell>{m.first_name} {m.last_name}</TableCell>
                    <TableCell>{m.email}</TableCell>
                    <TableCell>
                      {canManage ? (
                        <Select
                          value={m.role}
                          size="small"
                          onChange={(e: SelectChangeEvent) =>
                            handleRoleChange(m.id, e.target.value)
                          }
                          sx={{ minWidth: 100 }}
                        >
                          {ROLES.map((r) => (
                            <MenuItem key={r} value={r}>
                              {r}
                            </MenuItem>
                          ))}
                        </Select>
                      ) : (
                        <Chip label={m.role} size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      {isRestrictableRole(m.role) ? (
                        m.project_ids === null ? (
                          <Chip
                            label="All projects"
                            size="small"
                            color="default"
                            onClick={
                              canManage
                                ? () =>
                                    setExpandedMember(
                                      expandedMember === m.id ? null : m.id
                                    )
                                : undefined
                            }
                          />
                        ) : (
                          <Chip
                            label={`${m.project_ids.length} project${m.project_ids.length !== 1 ? "s" : ""}`}
                            size="small"
                            color="primary"
                            onClick={
                              canManage
                                ? () =>
                                    setExpandedMember(
                                      expandedMember === m.id ? null : m.id
                                    )
                                : undefined
                            }
                          />
                        )
                      ) : (
                        <Chip label="All projects" size="small" color="default" />
                      )}
                    </TableCell>
                    {canManage && (
                      <TableCell align="right">
                        <Tooltip title="Remove member">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveMember(m.id)}
                          >
                            <PersonRemove fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    )}
                  </TableRow>
                  {/* Expanded project access row */}
                  {canManage && isRestrictableRole(m.role) && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        sx={{ p: 0, borderBottom: expandedMember === m.id ? undefined : "none" }}
                      >
                        <Collapse in={expandedMember === m.id}>
                          <Box sx={{ p: 2, bgcolor: "grey.50" }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Project Access for {m.first_name} {m.last_name}
                            </Typography>
                            {projects.length === 0 ? (
                              <Typography variant="body2" color="text.secondary">
                                No projects in this tenant.
                              </Typography>
                            ) : (
                              <>
                                <FormGroup row>
                                  {projects.map((proj) => (
                                    <FormControlLabel
                                      key={proj.id}
                                      control={
                                        <Checkbox
                                          checked={
                                            m.project_ids === null ||
                                            m.project_ids.includes(proj.id)
                                          }
                                          onChange={() =>
                                            handleProjectToggle(
                                              m.id,
                                              proj.id,
                                              m.project_ids
                                            )
                                          }
                                          size="small"
                                          disabled={m.project_ids === null}
                                        />
                                      }
                                      label={proj.name}
                                    />
                                  ))}
                                </FormGroup>
                                <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
                                  {m.project_ids === null ? (
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      onClick={() =>
                                        handleProjectToggle(
                                          m.id,
                                          projects[0]?.id,
                                          []
                                        )
                                      }
                                    >
                                      Restrict to specific projects
                                    </Button>
                                  ) : (
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      onClick={() =>
                                        handleClearProjectAccess(m.id)
                                      }
                                    >
                                      Grant access to all projects
                                    </Button>
                                  )}
                                </Box>
                              </>
                            )}
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
              {members.length === 0 && (
                <TableRow>
                  <TableCell colSpan={canManage ? 5 : 4} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No members found.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {canManage && (
        <Card>
          <CardHeader title="Pending Invitations" />
          <CardContent sx={{ p: 0 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Sent</TableCell>
                  <TableCell>Invited By</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invitations.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>{inv.email}</TableCell>
                    <TableCell>
                      <Chip label={inv.role} size="small" />
                    </TableCell>
                    <TableCell>
                      {new Date(inv.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{inv.invited_by_email}</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Revoke invitation">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRevokeInvite(inv.id)}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {invitations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No pending invitations.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onClose={() => setInviteOpen(false)}>
        <DialogTitle>Invite Member</DialogTitle>
        <DialogContent>
          {inviteError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {inviteError}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="Email Address"
            type="email"
            fullWidth
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />
          <Select
            value={inviteRole}
            onChange={(e: SelectChangeEvent) => setInviteRole(e.target.value)}
            fullWidth
            sx={{ mt: 2 }}
          >
            {ROLES.map((r) => (
              <MenuItem key={r} value={r}>
                {r}
              </MenuItem>
            ))}
          </Select>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSendInvite}
            variant="contained"
            startIcon={<Send />}
            disabled={!inviteEmail}
          >
            Send Invite
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeamMembersPage;
