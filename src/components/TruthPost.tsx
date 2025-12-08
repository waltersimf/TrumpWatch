import React from 'react';
import { TruthPost } from '../types';
import { MessageSquare, Repeat, Heart, Link as LinkIcon } from 'lucide-react';

interface TruthPostProps {
  post: TruthPost | null;
  loading: boolean;
}

const TruthPostComp: React.FC<TruthPostProps> = ({ post, loading }) => {
  if (loading) return (
    <div className="glass-panel p-6 rounded-xl animate-pulse h-48">
      <div className="h-6 bg-slate-700 rounded w-1/3 mb-4"></div>
      <div className="h-4 bg-slate-700 rounded w-full mb-2"></div>
      <div className="h-4 bg-slate-700 rounded w-2/3"></div>
    </div>
  );

  if (!post) return null;

  // Basic HTML stripping for safety if content contains raw HTML
  const createMarkup = (html: string) => {
    return { __html: html };
  };

  return (
    <div className="glass-panel p-6 rounded-xl border border-slate-700 hover:border-slate-600 transition-colors">
      <div className="flex items-center justify-between mb-4 border-b border-slate-700 pb-3">
        <h3 className="text-red-500 font-bold uppercase text-xs tracking-wider flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
          Latest Truth Social
        </h3>
        <span className="text-xs text-slate-500">
          {new Date(post.created_at).toLocaleString()}
        </span>
      </div>

      <div className="mb-4">
        <div 
          className="text-slate-200 text-sm md:text-base leading-relaxed break-words [&>p]:mb-2 [&>a]:text-blue-400 [&>a]:underline"
          dangerouslySetInnerHTML={createMarkup(post.content)}
        />
        
        {post.media_attachments && post.media_attachments.length > 0 && (
           <div className="mt-4 rounded-lg overflow-hidden border border-slate-700 bg-black">
             {post.media_attachments[0].type === 'image' ? (
               <img src={post.media_attachments[0].url} alt="Attachment" className="max-h-64 mx-auto object-contain" />
             ) : (
                <div className="p-4 text-center text-xs text-slate-500 flex flex-col items-center">
                    <LinkIcon className="mb-2" />
                    Media Attachment ({post.media_attachments[0].type})
                </div>
             )}
           </div>
        )}
      </div>

      <div className="flex gap-6 text-slate-500 text-xs md:text-sm pt-2">
        <div className="flex items-center gap-1.5">
          <MessageSquare size={14} />
          <span>{post.stats?.replies_count || 0}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Repeat size={14} />
          <span>{post.stats?.reblogs_count || 0}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Heart size={14} />
          <span>{post.stats?.favourites_count || 0}</span>
        </div>
      </div>
    </div>
  );
};

export default TruthPostComp;