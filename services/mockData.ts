import { Contact, DriveFile, Visit } from '../types';

// MANTEMOS APENAS COMO SEED INICIAL CASO O STORAGE ESTEJA VAZIO
export const MOCK_CONTACTS: Contact[] = [
    { id: '123456789@c.us', name: 'Exemplo Cliente', phone: '5511999999999', status: 'pending', pipelineStage: 'new', value: 350000, source: 'Manual' }
];

export const MOCK_DRIVE_FILES: DriveFile[] = [];

export const MOCK_VISITS: Visit[] = [];