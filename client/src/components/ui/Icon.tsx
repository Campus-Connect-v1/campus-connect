import Alert02Icon from "@hugeicons/core-free-icons/Alert02Icon";
import ArrowLeft01Icon from "@hugeicons/core-free-icons/ArrowLeft01Icon";
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon";
import BookOpen01Icon from "@hugeicons/core-free-icons/BookOpen01Icon";
import Bookmark02Icon from "@hugeicons/core-free-icons/Bookmark02Icon";
import CalendarFavorite02Icon from "@hugeicons/core-free-icons/CalendarFavorite02Icon";
import Camera01Icon from "@hugeicons/core-free-icons/Camera01Icon";
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon";
import ChromeIcon from "@hugeicons/core-free-icons/ChromeIcon";
import Compass01Icon from "@hugeicons/core-free-icons/Compass01Icon";
import ImageAdd01Icon from "@hugeicons/core-free-icons/ImageAdd01Icon";
import PlayIcon from "@hugeicons/core-free-icons/PlayIcon";
import Video01Icon from "@hugeicons/core-free-icons/Video01Icon";
import Edit02Icon from "@hugeicons/core-free-icons/Edit02Icon";
import FavouriteIcon from "@hugeicons/core-free-icons/FavouriteIcon";
import FireIcon from "@hugeicons/core-free-icons/FireIcon";
import FootballIcon from "@hugeicons/core-free-icons/FootballIcon";
import HelpCircleIcon from "@hugeicons/core-free-icons/HelpCircleIcon";
import Home05Icon from "@hugeicons/core-free-icons/Home05Icon";
import Location01Icon from "@hugeicons/core-free-icons/Location01Icon";
import Logout03Icon from "@hugeicons/core-free-icons/Logout03Icon";
import LockKeyIcon from "@hugeicons/core-free-icons/LockKeyIcon";
import Mail02Icon from "@hugeicons/core-free-icons/Mail02Icon";
import MapsSearchIcon from "@hugeicons/core-free-icons/MapsSearchIcon";
import Menu02Icon from "@hugeicons/core-free-icons/Menu02Icon";
import Message01Icon from "@hugeicons/core-free-icons/Message01Icon";
import Mortarboard01Icon from "@hugeicons/core-free-icons/Mortarboard01Icon";
import MusicNote02Icon from "@hugeicons/core-free-icons/MusicNote02Icon";
import MoreVerticalIcon from "@hugeicons/core-free-icons/MoreVerticalIcon";
import Navigation03Icon from "@hugeicons/core-free-icons/Navigation03Icon";
import Notification03Icon from "@hugeicons/core-free-icons/Notification03Icon";
import PaintBrush02Icon from "@hugeicons/core-free-icons/PaintBrush02Icon";
import PlusSignIcon from "@hugeicons/core-free-icons/PlusSignIcon";
import Radar01Icon from "@hugeicons/core-free-icons/Radar01Icon";
import Restaurant01Icon from "@hugeicons/core-free-icons/Restaurant01Icon";
import Search01Icon from "@hugeicons/core-free-icons/Search01Icon";
import SentIcon from "@hugeicons/core-free-icons/SentIcon";
import Settings02Icon from "@hugeicons/core-free-icons/Settings02Icon";
import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon";
import UserAdd01Icon from "@hugeicons/core-free-icons/UserAdd01Icon";
import UserStoryIcon from "@hugeicons/core-free-icons/UserStoryIcon";
import ConnectIcon from "@hugeicons/core-free-icons/ConnectIcon";
import UniversityIcon from "@hugeicons/core-free-icons/UniversityIcon";
import ViewIcon from "@hugeicons/core-free-icons/ViewIcon";
import ViewOffIcon from "@hugeicons/core-free-icons/ViewOffIcon";
import { HugeiconsIcon } from "@hugeicons/react-native";

/**
 * The app's entire icon vocabulary, in one place.
 *
 * Icons are imported by SUBPATH, one per line, not from the package barrel.
 * Metro does not tree-shake named exports, so `import { X } from
 * "@hugeicons/core-free-icons"` pulls all 14,824 icons in — worth 7 MB of
 * bundle. The subpath form costs only what is listed here.
 *
 * Screens name an icon by role rather than importing glyphs directly, so
 * swapping the set (or one glyph) is a single edit here instead of a hunt
 * through every screen. It also stops two screens picking different glyphs for
 * the same idea, which is the usual way icon sets rot.
 */
export const ICONS = {
  home: Home05Icon,
  connect: ConnectIcon,
  events: CalendarFavorite02Icon,
  profile: UserStoryIcon,
  create: Edit02Icon,
  edit: Edit02Icon,
  campus: UniversityIcon,

  search: Search01Icon,
  notification: Notification03Icon,
  message: Message01Icon,
  mail: Mail02Icon,
  menu: Menu02Icon,
  more: MoreVerticalIcon,

  like: FavouriteIcon,
  save: Bookmark02Icon,
  add: PlusSignIcon,
  send: SentIcon,
  connectAdd: UserAdd01Icon,
  check: Tick02Icon,
  close: Cancel01Icon,
  back: ArrowLeft01Icon,
  forward: ArrowRight01Icon,

  location: Location01Icon,
  map: MapsSearchIcon,
  radar: Radar01Icon,
  navigate: Navigation03Icon,
  compass: Compass01Icon,

  visible: ViewIcon,
  hidden: ViewOffIcon,
  settings: Settings02Icon,
  privacy: LockKeyIcon,
  appearance: PaintBrush02Icon,
  camera: Camera01Icon,
  photo: ImageAdd01Icon,
  video: Video01Icon,
  play: PlayIcon,
  logout: Logout03Icon,
  help: HelpCircleIcon,
  alert: Alert02Icon,
  course: BookOpen01Icon,
  trending: FireIcon,
  sports: FootballIcon,
  academic: Mortarboard01Icon,
  entertainment: MusicNote02Icon,
  food: Restaurant01Icon,
  google: ChromeIcon,
} as const;

export type IconName = keyof typeof ICONS;

export interface IconProps {
  name: IconName;
  size?: number;
  color: string;
  /** Hugeicons default is 1.5. Bump to 2 for small sizes that read too faint. */
  strokeWidth?: number;
  /**
   * Fill the glyph rather than outlining it.
   *
   * The icon set is stroke-only, so an "active" state otherwise has to be
   * carried by colour alone — which is too weak a signal for a toggle like a
   * like button, where the difference between on and off should be obvious at
   * a glance and not depend on remembering which colour meant what.
   *
   * HugeiconsProps extends SvgProps, so fill passes straight through to the
   * underlying paths.
   */
  filled?: boolean;
}

export function Icon({ name, size = 22, color, strokeWidth = 1.8, filled = false }: IconProps) {
  return (
    <HugeiconsIcon
      icon={ICONS[name]}
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      // "none" rather than undefined: react-native-svg inherits fill from the
      // parent otherwise, which paints outline icons solid at random.
      fill={filled ? color : "none"}
    />
  );
}
