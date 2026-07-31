import { componentRegistry } from "./registry.js";
import {
  TextComponent,
  HeadingComponent,
  ButtonComponent,
  ImageComponent,
  DividerComponent,
} from "./components/basic.js";
import {
  SectionComponent,
  ContainerComponent,
  StackComponent,
  GridComponent,
  SpacerComponent,
} from "./components/layout.js";
import {
  HeroComponent,
  CtaBannerComponent,
  TestimonialComponent,
  FeatureGridComponent,
} from "./components/marketing.js";
import { StatsCounterComponent, TeamGridComponent } from "./components/business.js";
import { NavbarComponent, FooterComponent } from "./components/navigation.js";
import {
  TextInputComponent,
  FormContainerComponent,
  SubmitButtonComponent,
} from "./components/forms.js";
import { EmbedComponent, AnchorComponent } from "./components/utility.js";

let registered = false;

export function registerBuiltins(): void {
  if (registered) return;
  const defs = [
    TextComponent,
    HeadingComponent,
    ButtonComponent,
    ImageComponent,
    DividerComponent,
    SectionComponent,
    ContainerComponent,
    StackComponent,
    GridComponent,
    SpacerComponent,
    HeroComponent,
    CtaBannerComponent,
    TestimonialComponent,
    FeatureGridComponent,
    StatsCounterComponent,
    TeamGridComponent,
    NavbarComponent,
    FooterComponent,
    TextInputComponent,
    FormContainerComponent,
    SubmitButtonComponent,
    EmbedComponent,
    AnchorComponent,
  ];
  for (const def of defs) {
    componentRegistry.register(def as never);
  }
  registered = true;
}
