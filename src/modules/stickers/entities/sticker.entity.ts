import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { StickerPack } from './sticker-pack.entity';

@Entity('stickers')
export class Sticker {
    @PrimaryColumn('varchar')
    id: string;

    @Column({ name: 'pack_id', type: 'varchar' })
    packId: string;

    @Column({ type: 'text' })
    url: string;

    @Column({ name: 'key_url', type: 'text', nullable: true })
    keyUrl?: string;

    @Column({ name: 'alt_text', type: 'varchar', nullable: true })
    altText?: string;

    @Column({ name: 'sort_order', type: 'int', default: 0 })
    sortOrder: number;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @ManyToOne(() => StickerPack, (pack) => pack.stickers, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'pack_id' })
    pack: StickerPack;
}
