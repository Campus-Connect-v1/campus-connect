// <!DOCTYPE html>
// <html lang="en"><head>
// <meta charset="utf-8"/>
// <meta content="width=device-width, initial-scale=1.0" name="viewport"/>
// <title>UniCliq - Chats</title>
// <link href="https://fonts.googleapis.com" rel="preconnect"/>
// <link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
// <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>
// <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
// <script id="tailwind-config">
//     tailwind.config = {
//       darkMode: "class",
//       theme: {
//         extend: {
//           colors: {
//             "primary": "#003652",
//             "background-light": "#f5f7f8",
//             "background-dark": "#0f1c23",
//           },
//           fontFamily: {
//             "display": ["Inter"]
//           },
//           borderRadius: {
//             "DEFAULT": "0.5rem",
//             "lg": "1rem",
//             "xl": "1.5rem",
//             "full": "9999px"
//           },
//         },
//       },
//     }
//   </script>
// <style>
//     .material-symbols-outlined {
//       font-variation-settings:
//       'FILL' 0,
//       'wght' 400,
//       'GRAD' 0,
//       'opsz' 24
//     }
//   </style>
// <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet"/>
// <style>
//     body {
//       min-height: max(884px, 100dvh);
//     }
//   </style>
//   </head>
// <body class="bg-background-light dark:bg-background-dark font-display">
// <div class="max-w-md mx-auto min-h-screen flex flex-col">
// <header class="p-4 bg-background-light dark:bg-background-dark sticky top-0 z-10">
// <h1 class="text-2xl font-bold text-center text-primary dark:text-white">UniCliq Chats</h1>
// </header>
// <div class="px-4 pb-4">
// <div class="relative">
// <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary/60 dark:text-white/60">search</span>
// <input class="w-full h-12 pl-10 pr-4 rounded-lg bg-background-light dark:bg-primary/20 border border-primary/20 dark:border-primary/30 focus:ring-primary focus:border-primary text-primary dark:text-white placeholder-primary/60 dark:placeholder-white/60" placeholder="Search conversations..." type="text"/>
// </div>
// </div>
// <main class="flex-grow space-y-2 px-2 overflow-y-auto">
// <div class="flex items-center gap-4 p-3 rounded-lg bg-gradient-to-r from-primary/20 to-primary/10 dark:from-primary/30 dark:to-primary/20 shadow-sm">
// <div class="relative">
// <img alt="Sophia Bennett" class="w-14 h-14 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA0tM4S8YN49oZ_yiWv5QSm77P6zKO0GFrtPq6S0R1uINRkY8Bv1Sf319skDkHcjBvsDqqvnLfDhygGHGDR_J2_qgHvKHhrN7gPftZQybPVC-pd1kcNoYtXlYBnhL4P-unrz8lLH0yo1b65wED4kbzMsk-8Db7b9UQqiWuEKUguqpGdWV9XjG58PONDq5IJJE2utDESVCP_ZgPEoX5husD2cIfDkwpsaygUxU8uSgVQgNcuJQqVU6Z7yy8ryekYq9MBD9TUXjeB6kQ"/>
// <div class="absolute -bottom-1 -right-1 bg-primary text-white rounded-full p-0.5">
// <span class="material-symbols-outlined text-sm">school</span>
// </div>
// </div>
// <div class="flex-grow">
// <div class="flex justify-between items-center">
// <p class="font-bold text-primary dark:text-white">Sophia Bennett</p>
// <p class="text-xs text-primary/80 dark:text-white/70">11:15 AM</p>
// </div>
// <div class="flex justify-between items-center">
// <p class="text-sm text-primary/80 dark:text-white/70 truncate">See you at the library later!</p>
// </div>
// </div>
// </div>
// <div class="flex items-center gap-4 p-3 rounded-lg hover:bg-primary/10 dark:hover:bg-primary/20 cursor-pointer">
// <div class="relative">
// <img alt="Ethan Harper" class="w-14 h-14 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBmZnSm8YRmz3lxa0vinqtILxgZB_oBEkXUF7BdHElJXO_H_yWHh8iYWQFU7NrfsbSHBXhX0ijkb1pjYqEv2oZjUTxnU1_FGoDbezfhA9ynQ91Z6yc0Rgof6kkNp5w1LxJVdXK554t4KyQCYhKaDpZD8Z_L9n9y01ujpIk2xBw2dYRH5_KzU2JknCT66qq3OiudVRY2xXs8qO2BQVJe0l72E8aGJAEt5GNJbejlAaX5Ipw5cKvSJ2spxD0raCY4vJujmm_y7GPIjr4"/>
// </div>
// <div class="flex-grow">
// <div class="flex justify-between items-center">
// <p class="font-semibold text-primary dark:text-white">Ethan Harper</p>
// <p class="text-xs text-primary/60 dark:text-white/60">10:30 AM</p>
// </div>
// <div class="flex justify-between items-center">
// <p class="text-sm text-primary/60 dark:text-white/60 truncate">Hey, how's the project going?</p>
// <span class="w-2.5 h-2.5 bg-primary rounded-full ml-2 flex-shrink-0"></span>
// </div>
// </div>
// </div>
// <div class="flex items-center gap-4 p-3 rounded-lg hover:bg-primary/10 dark:hover:bg-primary/20 cursor-pointer">
// <div class="relative">
// <img alt="Liam Carter" class="w-14 h-14 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCPtPiH9au_f6oPNfbcxsUpg1qtdJTPXpM5q6SgQQk4ee8osRtc5KAdNk35Zs0zkjXVW_MQUweVyD3emnQHRsjWyOSF1QTd0qILlBBXUnl90p-kj2qGTQPBQXFVCvoXdI1085NdJDvO9wLUvyDxVzEBNvTBbcIsgZUVlYgvc6_ybjDpq0JT_QQ94swb0Hey_UCPXRZq56isID2MvZ5FfnrScv9oasoVeI_H9Y9yr09zQxNzeH6SGGCiey0_D7I3-MuarkI4Ia3xtYo"/>
// </div>
// <div class="flex-grow">
// <div class="flex justify-between items-center">
// <p class="font-semibold text-primary dark:text-white">Liam Carter</p>
// <p class="text-xs text-primary/60 dark:text-white/60">12:45 PM</p>
// </div>
// <p class="text-sm text-primary/60 dark:text-white/60 truncate">Did you finish the assignment?</p>
// </div>
// </div>
// <div class="flex items-center gap-4 p-3 rounded-lg hover:bg-primary/10 dark:hover:bg-primary/20 cursor-pointer">
// <div class="relative">
// <img alt="Olivia Davis" class="w-14 h-14 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAStclRpJg5V6BkhqplkBOgKhpNv5GaUUtyCstU6ZkFHee3LL1e9pzex0qsIzeJQc0ZNjBV5nAcE0XJBx7nT4APGiMULdD8V-UConljAiSEuwOBDiCKiHwgMOUK-nMXXI7VZ7uUeoSA6WeJYBAqx4CJsXCXv9GRvTV3pnVTo444n26AEGyoonsMZ6p7PgV1Ful9kVPYRyGWNjZCKOpCOytoQ3BYncBvRewBGnm5jO4OubsB9_J8NJSQZZzlfrVcCzGW6eqQ0NkdM_0"/>
// </div>
// <div class="flex-grow">
// <div class="flex justify-between items-center">
// <p class="font-semibold text-primary dark:text-white">Olivia Davis</p>
// <p class="text-xs text-primary/60 dark:text-white/60">1:30 PM</p>
// </div>
// <div class="flex justify-between items-center">
// <p class="text-sm text-primary/60 dark:text-white/60 truncate">Let's grab coffee after class.</p>
// <span class="w-2.5 h-2.5 bg-primary rounded-full ml-2 flex-shrink-0"></span>
// </div>
// </div>
// </div>
// <div class="flex items-center gap-4 p-3 rounded-lg hover:bg-primary/10 dark:hover:bg-primary/20 cursor-pointer">
// <div class="relative">
// <img alt="Noah Evans" class="w-14 h-14 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAITAfVXNQVPlQRb3r833G7w3MeIi8-46vjnhhQN_4L7ESRUBSg3mQzSzXSAJx_0Dus5NBGJbasbezspyAQsF7GT8UxRTRqMgd49Php8Oqu4gRnv6-ijGGC3FxL6X0a-Kxh000YrJLtbKtu28pBksOigNs93E44aEd5bbQ8XSNbINjRDiUahMexMMRXQjg3Qb8gpxOM-Eb4ehCzsBcZE8R2L-cHu9KZvUAywNTho_sP36MYnc3Mw7fp6xYrMHj4AM4WcKk71ak_znY"/>
// </div>
// <div class="flex-grow">
// <div class="flex justify-between items-center">
// <p class="font-semibold text-primary dark:text-white">Noah Evans</p>
// <p class="text-xs text-primary/60 dark:text-white/60">2:00 PM</p>
// </div>
// <p class="text-sm text-primary/60 dark:text-white/60 truncate">Are you coming to the study group?</p>
// </div>
// </div>
// <div class="flex items-center gap-4 p-3 rounded-lg hover:bg-primary/10 dark:hover:bg-primary/20 cursor-pointer">
// <div class="relative">
// <img alt="Ava Foster" class="w-14 h-14 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDmQk521RMn_lV6kDe4dUERBT1GU-UVIag8gVxNGzcYpTiU-DYczmMsfLG5JE0XLW-jw4OOwTe9q5UQr1DQww72KMjg2XQRN7V49wHtoOAepnu9FGDDYMFQ8BTzs1UMqan3fNorzMmSwKrYaPAM6E-vb-pE9BzYdq1M_s9RH4HakzASFogftEtBwUFUMAwTS5DXAgs1RVTxcccRjC3N6dYClT82-OgxXnZMzluDVmbOByx-qYp9p7E-0ajsBohgheMVAA3Tchb3Mzg"/>
// </div>
// <div class="flex-grow">
// <div class="flex justify-between items-center">
// <p class="font-semibold text-primary dark:text-white">Ava Foster</p>
// <p class="text-xs text-primary/60 dark:text-white/60">3:15 PM</p>
// </div>
// <p class="text-sm text-primary/60 dark:text-white/60 truncate">I need help with the math problems.</p>
// </div>
// </div>
// <div class="flex items-center gap-4 p-3 rounded-lg hover:bg-primary/10 dark:hover:bg-primary/20 cursor-pointer">
// <div class="relative">
// <img alt="Jackson Gray" class="w-14 h-14 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuApu2VPGCa20rKEY4y5LlKHy63w-SaNNQeq-dAASvaAY8rDbxzuE3IJZQCZ9XCbMPczZY7eZN_gNI5q2CWa8ws_hGZxNjYQcEMLliUgeb144tg_Hc02mkx01KXef3zM5AIaOxNznMsrIjbjhhZaMh1pOYGTzXvNCft3buX3pOObKsl8ctwYXLSk3HrWkTl2MPn60o71RszXUUoUK_pjBZblkHAw_VmK0MH3R3VRhq1EyQjvTgxeA8xCy8aB5l1xYrrQ3UpBomERU00"/>
// </div>
// <div class="flex-grow">
// <div class="flex justify-between items-center">
// <p class="font-semibold text-primary dark:text-white">Jackson Gray</p>
// <p class="text-xs text-primary/60 dark:text-white/60">4:45 PM</p>
// </div>
// <p class="text-sm text-primary/60 dark:text-white/60 truncate">Don't forget about the presentation.</p>
// </div>
// </div>
// </main>
// <div class="sticky bottom-0 right-0 p-4 pt-0">
// <button class="absolute bottom-6 right-6 w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white shadow-lg hover:bg-primary/90 transition-colors">
// <span class="material-symbols-outlined text-3xl">edit</span>
// </button>
// </div>
// </div>

// </body></html>


import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

const Message = () => {
  return (
    <View>
      <Text>Message</Text>
    </View>
  )
}

export default Message

const styles = StyleSheet.create({})