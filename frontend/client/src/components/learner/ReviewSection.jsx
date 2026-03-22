import Badge from '../common/Badge';
import StarRating from '../common/StarRating';
import { formatDate, getInitials } from '../../utils/helpers';
import {
  HiOutlineChatAlt2,
  HiOutlinePencilAlt,
  HiOutlineStar,
  HiOutlineUserCircle,
} from 'react-icons/hi';

const ratingLabels = {
  1: 'Needs major improvement',
  2: 'Below expectations',
  3: 'Solid learning experience',
  4: 'Very good course',
  5: 'Excellent course',
};

const RatingBreakdown = ({ reviews = [] }) => {
  const total = reviews.length || 1;

  return (
    <div className="space-y-3">
      {[5, 4, 3, 2, 1].map((star) => {
        const count = reviews.filter((review) => review.rating === star).length;
        const percentage = Math.round((count / total) * 100);

        return (
          <div key={star} className="flex items-center gap-3">
            <div className="flex w-12 items-center gap-1 text-sm font-semibold text-slate-700">
              <span>{star}</span>
              <HiOutlineStar className="h-4 w-4 text-amber-400" />
            </div>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="w-10 text-right text-xs font-medium text-slate-500">{count}</div>
          </div>
        );
      })}
    </div>
  );
};

const ReviewSection = ({
  averageRating = 0,
  reviewCount = 0,
  reviews = [],
  isAuthenticated,
  user,
  onAddReview,
}) => {
  const currentUserReview = reviews.find((review) => review.userId?._id === user?._id);
  const roundedAverage = Number(averageRating || 0).toFixed(1);

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="rounded-[28px] border border-slate-200 bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.20),_transparent_35%),linear-gradient(180deg,#ffffff_0%,#fffaf0_100%)] p-6 shadow-[0_30px_60px_-45px_rgba(15,23,42,0.45)]">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">Course Rating</p>
        <div className="mt-4 flex items-end gap-3">
          <span className="text-5xl font-semibold tracking-tight text-slate-900">{roundedAverage}</span>
          <div className="pb-2">
            <StarRating rating={Number(averageRating)} readonly size="md" />
            <p className="mt-2 text-sm text-slate-500">
              Based on {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-amber-100 bg-white/80 p-4">
          <RatingBreakdown reviews={reviews} />
        </div>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
              <HiOutlineChatAlt2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                {currentUserReview ? 'Update your review' : 'Share your experience'}
              </h3>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Logged-in users can add a rating and written review directly from this course page.
              </p>
            </div>
          </div>

          {currentUserReview && (
            <div className="mt-4 rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Your current review</p>
              <div className="mt-3 flex items-center gap-2">
                <StarRating rating={currentUserReview.rating} readonly size="sm" />
                <span className="text-sm font-medium text-slate-700">{ratingLabels[currentUserReview.rating]}</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {currentUserReview.comment || 'You submitted a rating without additional text.'}
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={onAddReview}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <HiOutlinePencilAlt className="h-5 w-5" />
            {isAuthenticated ? (currentUserReview ? 'Edit Review' : 'Add Review') : 'Login to Add Review'}
          </button>
        </div>
      </aside>

      <section className="rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_60px_-45px_rgba(15,23,42,0.45)]">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-600">Ratings & Reviews</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">What learners are saying</h2>
          </div>
          <Badge variant="info" size="md">
            {reviewCount} {reviewCount === 1 ? 'Review' : 'Reviews'}
          </Badge>
        </div>

        <div className="divide-y divide-slate-100">
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <article key={review._id} className="px-6 py-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 via-sky-500 to-indigo-600 text-sm font-semibold text-white shadow-sm">
                    {getInitials(review.userId?.name || 'U')}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-slate-900">
                            {review.userId?.name || 'Anonymous learner'}
                          </h3>
                          {review.userId?._id === user?._id && <Badge variant="primary" size="xs">You</Badge>}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-3">
                          <StarRating rating={review.rating} readonly size="sm" />
                          <span className="text-sm font-medium text-slate-700">{ratingLabels[review.rating]}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <HiOutlineUserCircle className="h-4 w-4" />
                        <span>{formatDate(review.createdAt)}</span>
                      </div>
                    </div>

                    <p className="mt-4 text-sm leading-7 text-slate-600">
                      {review.comment?.trim() || 'This learner left a rating without a written comment.'}
                    </p>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-50 text-amber-500">
                <HiOutlineStar className="h-8 w-8" />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-slate-900">No reviews yet</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                This course has not received any ratings or written reviews yet. Be the first logged-in learner to leave feedback.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ReviewSection;
