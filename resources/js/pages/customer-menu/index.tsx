import { MenuView } from '@/pages/menu/menu-view';

export default function CustomerMenu(props: React.ComponentProps<typeof MenuView>) {
    return <MenuView {...props} basePath="/customer-menu" allowTableSelection={false} />;
}
