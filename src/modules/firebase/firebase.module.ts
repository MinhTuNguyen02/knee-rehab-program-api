import { Module, Global } from '@nestjs/common';
import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import * as path from 'path';
import * as fs from 'fs';

@Global()
@Module({
    providers: [
        {
            provide: 'FIREBASE_ADMIN',
            useFactory: () => {
                const renderSecretPath = '/etc/secrets/ServiceAccountKey.json';
                const localPath = path.join(__dirname, '../../config/ServiceAccountKey.json');
                // const serviceAccountPath = path.resolve(__dirname, '../../config/ServiceAccountKey.json');

                const serviceAccountPath = fs.existsSync(renderSecretPath) ? renderSecretPath : localPath;
                if (getApps().length === 0) {
                    return initializeApp({
                        credential: cert(serviceAccountPath),
                    });
                }
                return getApp();
            },
        },
    ],
    exports: ['FIREBASE_ADMIN'],
})
export class FirebaseModule { }