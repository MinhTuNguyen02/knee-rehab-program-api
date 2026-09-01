import { Entity, PrimaryColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Sticker } from './sticker.entity';

@Entity('sticker_packs')
export class StickerPack {
    @PrimaryColumn('varchar')
    id: string;

    @Column({ type: 'varchar' })
    name: string;

    @Column({ name: 'thumbnail_url', type: 'text' })
    thumbnailUrl: string;

    @Column({ name: 'sort_order', type: 'int', default: 0 })
    sortOrder: number;

    @Column({ name: 'is_active', type: 'boolean', default: true })
    isActive: boolean;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @OneToMany(() => Sticker, (sticker) => sticker.pack, { cascade: true })
    stickers: Sticker[];
}
