import { Plus } from 'lucide-react';
import React from 'react';
import { PlaceholderZone } from './PlaceholderZone';

export const EmptyDropZone: React.FC = () => <PlaceholderZone icon={Plus} label="Letakkan elemen di sini" className="py-8" />;
