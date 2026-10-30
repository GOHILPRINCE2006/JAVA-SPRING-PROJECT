import { Link } from 'react-router-dom';
import { MapPin, CalendarDays } from 'lucide-react';
import { ItemStatusBadge } from './StatusBadge';
import { excerpt, formatDate } from '../utils/format';

const EDGE = {
  LOST: 'border-l-[#d88a1d]',
  FOUND: 'border-l-[#1b9c85]',
  CLAIMED: 'border-l-[#5a5fd1]',
  RESOLVED: 'border-l-[#8795a5]',
};

/** A listing styled like a luggage tag: coloured edge by status, punched hole, whole card is the link. */
export default function ItemCard({ item }) {
  return (
    <article
      className={`panel relative border-l-8 ${EDGE[item.status] ?? EDGE.RESOLVED} transition-colors focus-within:border-harbor-600 hover:border-harbor-600`}
    >
      <span aria-hidden="true" className="absolute right-4 top-4 h-3 w-3 rounded-full border-2 border-line bg-paper" />
      <div className="flex flex-col gap-3 p-5">
        <div className="flex items-center gap-2 pr-6">
          <ItemStatusBadge status={item.status} />
          {item.category?.name && <span className="text-sm text-muted">{item.category.name}</span>}
        </div>
        <h3 className="text-xl font-semibold">
          <Link to={`/items/${item.id}`} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-offset-4">
            {item.title}
          </Link>
        </h3>
        {item.description && <p className="text-muted">{excerpt(item.description)}</p>}
        <dl className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Location</dt>
            <MapPin className="h-4 w-4" aria-hidden="true" />
            <dd>{item.location}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Reported</dt>
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            <dd>{formatDate(item.reportedAt)}</dd>
          </div>
        </dl>
      </div>
    </article>
  );
}
