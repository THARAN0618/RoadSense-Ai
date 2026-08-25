import { uploadImageToStorage } from '../services/storageService';
import * as supabaseConfig from '../config/supabase';

// Helper mock file
const mockFile: Express.Multer.File = {
  fieldname: 'image',
  originalname: 'test-pothole.jpg',
  encoding: '7bit',
  mimetype: 'image/jpeg',
  buffer: Buffer.from('fake image content'),
  size: 18,
  stream: null as any,
  destination: '',
  filename: '',
  path: '',
};

describe('Supabase Storage Fallback & Behavior Unit Tests', () => {
  let savedEnv: {
    NODE_ENV?: string;
    SUPABASE_URL?: string;
    SUPABASE_SERVICE_ROLE_KEY?: string;
  };

  beforeEach(() => {
    savedEnv = {
      NODE_ENV: process.env.NODE_ENV,
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    };
    jest.restoreAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();

    if (savedEnv.NODE_ENV !== undefined) {
      process.env.NODE_ENV = savedEnv.NODE_ENV;
    } else {
      delete process.env.NODE_ENV;
    }

    if (savedEnv.SUPABASE_URL !== undefined) {
      process.env.SUPABASE_URL = savedEnv.SUPABASE_URL;
    } else {
      delete process.env.SUPABASE_URL;
    }

    if (savedEnv.SUPABASE_SERVICE_ROLE_KEY !== undefined) {
      process.env.SUPABASE_SERVICE_ROLE_KEY = savedEnv.SUPABASE_SERVICE_ROLE_KEY;
    } else {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    }
  });

  it('1. Development fallback: should fall back to local disk storage when NODE_ENV is development and Supabase credentials are missing', async () => {
    process.env.NODE_ENV = 'development';
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const result = await uploadImageToStorage(mockFile, 'potholes');
    expect(result).toMatch(/^\/uploads\/img-.*\.jpg$/);
  });

  it('2. Production missing config: should throw error in production when Supabase configuration is missing', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    await expect(uploadImageToStorage(mockFile, 'potholes')).rejects.toThrow(
      'Supabase Storage configuration missing in production environment'
    );
  });

  it('3. Production upload failure: should throw error when Supabase upload returns an error in production', async () => {
    process.env.NODE_ENV = 'production';
    process.env.SUPABASE_URL = 'https://fake-project.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'fake-service-key';

    const mockUpload = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'Bucket not found or permission denied' },
    });

    jest.spyOn(supabaseConfig, 'getSupabaseClient').mockReturnValue({
      storage: {
        from: jest.fn().mockReturnValue({
          upload: mockUpload,
        }),
      },
    } as any);

    await expect(uploadImageToStorage(mockFile, 'potholes')).rejects.toThrow(
      'Failed to upload image to cloud storage: Bucket not found or permission denied'
    );
  });

  it('4. Successful Supabase upload: should return object storage path upon successful upload', async () => {
    process.env.NODE_ENV = 'production';
    process.env.SUPABASE_URL = 'https://fake-project.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'fake-service-key';

    const mockUpload = jest.fn().mockResolvedValue({
      data: { path: 'potholes/img-12345.jpg' },
      error: null,
    });

    jest.spyOn(supabaseConfig, 'getSupabaseClient').mockReturnValue({
      storage: {
        from: jest.fn().mockReturnValue({
          upload: mockUpload,
        }),
      },
    } as any);

    const result = await uploadImageToStorage(mockFile, 'potholes');
    expect(result).toBe('potholes/img-12345.jpg');
  });
});
