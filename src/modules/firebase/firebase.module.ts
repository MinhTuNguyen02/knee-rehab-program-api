import { Module, Global } from '@nestjs/common';
import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import * as path from 'path';

@Global()
@Module({
    providers: [
        {
            provide: 'FIREBASE_ADMIN',
            useFactory: () => {
                const serviceAccountPath = path.resolve(__dirname, '../../config/ServiceAccountKey.json');

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