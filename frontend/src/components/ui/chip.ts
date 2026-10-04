export const chipClass = (selected: boolean) =>
  `whitespace-nowrap rounded-md border px-[14px] py-2 text-sm no-underline ${
    selected ? 'border-accent bg-accent text-white hover:text-white' : 'border-divider bg-transparent text-text hover:text-text'
  }`;
