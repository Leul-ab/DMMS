import { MenuView } from './menu-view';

export default function MenuIndex(props: React.ComponentProps<typeof MenuView>) {
    return <MenuView {...props} basePath="/menu" />;
}
