
import { MessageCircle, Heart, Repeat } from 'lucide-react';

const PostActions = () => {
  return (
    <div className="flex items-center justify-end space-x-1 p-0">
      <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 p-1.5">
        <MessageCircle size={16} />
      </button>
      <button className="flex items-center space-x-1 text-gray-500 hover:text-green-500 p-1.5">
        <Repeat size={16} />
      </button>
      <button className="flex items-center space-x-1 text-gray-500 hover:text-red-500 p-1.5">
        <Heart size={16} />
      </button>
    </div>
  );
};

export default PostActions;
