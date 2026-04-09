import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import toast from 'react-hot-toast';

// ── Dashboard ──────────────────────────────────────────────────────────────
export const useDashboardStats = () =>
  useQuery({ queryKey: ['dashboard'], queryFn: () => api.get('/stats/dashboard').then(r => r.data), refetchInterval: 30000 });

// ── Sectors ────────────────────────────────────────────────────────────────
export const useSectors = (params = {}) =>
  useQuery({ queryKey: ['sectors', params], queryFn: () => api.get('/sectors', { params }).then(r => r.data) });

export const useCreateSector = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/sectors', data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries(['sectors']); toast.success('Sector created'); },
  });
};

export const useApproveSector = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.put(`/sectors/${id}/approve`).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries(['sectors']); toast.success('Sector approved'); },
  });
};

export const useDeleteSector = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/sectors/${id}`),
    onSuccess: () => { qc.invalidateQueries(['sectors']); toast.success('Sector deleted'); },
  });
};

// ── Contacts ───────────────────────────────────────────────────────────────
export const useContacts = (params = {}) =>
  useQuery({
    queryKey: ['contacts', params],
    queryFn: () => api.get('/contacts', { params }).then(r => r.data),
    keepPreviousData: true,
  });

export const useCreateContact = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/contacts', data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries(['contacts']); toast.success('Contact created'); },
  });
};

export const useUpdateContact = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.put(`/contacts/${id}`, data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries(['contacts']); toast.success('Contact updated'); },
  });
};

export const useDeleteContact = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/contacts/${id}`),
    onSuccess: () => { qc.invalidateQueries(['contacts']); toast.success('Contact deleted'); },
  });
};

export const useUploadContacts = () =>
  useMutation({
    mutationFn: (file) => {
      const fd = new FormData();
      fd.append('file', file);
      return api.post('/contacts/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
    },
  });

export const useImportContacts = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file) => {
      const fd = new FormData();
      fd.append('file', file);
      return api.post('/contacts/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
    },
    onSuccess: (data) => {
      qc.invalidateQueries(['contacts']);
      toast.success(`Imported ${data.imported} contacts`);
    },
  });
};

// ── Templates ──────────────────────────────────────────────────────────────
export const useTemplates = () =>
  useQuery({ queryKey: ['templates'], queryFn: () => api.get('/templates').then(r => r.data) });

export const useCreateTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/templates', data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries(['templates']); toast.success('Template created'); },
  });
};

export const useUpdateTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => api.put(`/templates/${id}`, data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries(['templates']); toast.success('Template updated'); },
  });
};

export const useDeleteTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/templates/${id}`),
    onSuccess: () => { qc.invalidateQueries(['templates']); toast.success('Template deleted'); },
  });
};

// ── Campaigns ──────────────────────────────────────────────────────────────
export const useCampaigns = (params = {}) =>
  useQuery({ queryKey: ['campaigns', params], queryFn: () => api.get('/campaigns', { params }).then(r => r.data), refetchInterval: 10000 });

export const useCreateCampaign = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/campaigns', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries(['campaigns']),
  });
};

export const useSetRecipients = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, filter }) => api.post(`/campaigns/${id}/recipients`, { filter }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries(['campaigns']),
  });
};

export const useSendCampaign = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.post(`/campaigns/${id}/send`).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries(['campaigns']); toast.success('Campaign queued for sending'); },
  });
};

export const useDeleteCampaign = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/campaigns/${id}`),
    onSuccess: () => { qc.invalidateQueries(['campaigns']); toast.success('Campaign deleted'); },
  });
};

// ── CC Contacts ────────────────────────────────────────────────────────────
export const useCCContacts = () =>
  useQuery({ queryKey: ['cc-contacts'], queryFn: () => api.get('/cc-contacts').then(r => r.data) });

export const useCreateCC = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/cc-contacts', data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries(['cc-contacts']); toast.success('CC contact added'); },
  });
};

export const useDeleteCC = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/cc-contacts/${id}`),
    onSuccess: () => { qc.invalidateQueries(['cc-contacts']); toast.success('CC contact removed'); },
  });
};

// ── AI Extractor ───────────────────────────────────────────────────────────
export const useExtractionSources = () =>
  useQuery({ queryKey: ['extraction-sources'], queryFn: () => api.get('/extractor/sources').then(r => r.data) });

export const useAddSource = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/extractor/sources', data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries(['extraction-sources']); toast.success('Source added'); },
  });
};

export const useToggleSource = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.put(`/extractor/sources/${id}/toggle`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries(['extraction-sources']),
  });
};

export const useDeleteSource = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/extractor/sources/${id}`),
    onSuccess: () => { qc.invalidateQueries(['extraction-sources']); toast.success('Source deleted'); },
  });
};

export const useRunSource = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.post(`/extractor/sources/${id}/run`).then(r => r.data),
    onSuccess: () => { toast.success('Extraction started'); },
  });
};

export const useExtractedContacts = (params = {}) =>
  useQuery({
    queryKey: ['extracted-contacts', params],
    queryFn: () => api.get('/extractor/contacts', { params }).then(r => r.data),
  });

export const useApproveExtracted = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.post(`/extractor/contacts/${id}/approve`).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries(['extracted-contacts']); qc.invalidateQueries(['contacts']); toast.success('Contact approved'); },
  });
};

export const useRejectExtracted = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.post(`/extractor/contacts/${id}/reject`).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries(['extracted-contacts']); toast.success('Contact rejected'); },
  });
};
