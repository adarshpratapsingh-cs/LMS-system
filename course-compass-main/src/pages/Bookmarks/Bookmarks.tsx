import { useEffect, useState } from "react";
import { Heart, Loader2, BookmarkX } from "lucide-react";
import { courseApi } from "@/api/course.api";
import { CourseCard } from "@/components/common/CourseCard";
import { useAuth } from "@/store/AuthContext";
import { useNavigate } from "react-router-dom";

const WISHLIST_KEY = "lms_wishlist";

const getWishlist = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(WISHLIST_KEY) || "[]");
  } catch {
    return [];
  }
};

const Bookmarks = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [bookmarkedCourses, setBookmarkedCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    const loadBookmarks = async () => {
      try {
        const wishlistIds = getWishlist();

        if (wishlistIds.length === 0) {
          setBookmarkedCourses([]);
          return;
        }

        const res = await courseApi.getAllCourses();
        const allCourses = res.data.data || [];

        const savedCourses = allCourses.filter((course: any) =>
          wishlistIds.includes(course.id)
        );

        setBookmarkedCourses(savedCourses);
      } catch (error) {
        console.error("Failed to load bookmarks:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadBookmarks();
  }, [isAuthenticated, navigate]);

  const removeBookmark = (courseId: string) => {
    const current = getWishlist();
    const updated = current.filter((id) => id !== courseId);

    localStorage.setItem(WISHLIST_KEY, JSON.stringify(updated));

    setBookmarkedCourses((courses) =>
      courses.filter((course) => course.id !== courseId)
    );
  };

  if (isLoading) {
    return (
      <div className="container py-20 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Heart className="w-7 h-7 text-primary fill-primary" />
          <h1 className="font-display font-bold text-3xl md:text-4xl">
            My Bookmarks
          </h1>
        </div>

        <p className="text-muted-foreground">
          Courses you saved for later
        </p>
      </div>

      {bookmarkedCourses.length === 0 ? (
        <div className="p-16 text-center border border-border/50 rounded-2xl bg-card/30">
          <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />

          <h2 className="text-xl font-semibold mb-2">
            No bookmarked courses
          </h2>

          <p className="text-muted-foreground mb-6">
            You haven't bookmarked any courses yet.
          </p>

          <button
            onClick={() => navigate("/courses")}
            className="btn-primary"
          >
            Explore Courses
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {bookmarkedCourses.map((course, index) => (
            <div key={course.id} className="relative">
              <CourseCard course={course} index={index} />

              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  removeBookmark(course.id);
                }}
                className="absolute top-3 right-3 z-10 p-2 rounded-full bg-background/90 border border-border hover:bg-destructive hover:text-white transition-colors"
                title="Remove bookmark"
              >
                <BookmarkX className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Bookmarks;