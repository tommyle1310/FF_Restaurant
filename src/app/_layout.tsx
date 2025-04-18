import "../../global.css";
import "react-native-reanimated";
import { Provider } from "react-redux";
import store from "@/src/store/store";
import RootLayout from "@/src/app/screens/RootLayout";
import { registerRootComponent } from "expo";

export default function Layout() {
  // Render screen based on the current tab selection
  // registerRootComponent(App);

  return (
    <Provider store={store}>
      <RootLayout />
    </Provider>
  );
}
