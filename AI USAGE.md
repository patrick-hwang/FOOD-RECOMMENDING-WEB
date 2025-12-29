# AI USAGE
## HOANG DUC HUNG PHAT
- Gemini, Google, 09:30, Thursday, October 30, 2025 prompt: "Cách set up một website front-end sử dụng React, back-end sử dụng Flask". This student did not know how to start so he used AI to assist.
- Gemini, Google, 11:13, Sunday, November 02, 2025 prompt: "Giải thích thành phần này giúp tui:
#root {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}". This student wanted to learn about syntax of CSS.
- Gemini, Google, 11:16, Sunday, November 02, 2025 prompt: "rem là dài khoảng bao nhiêu hay tùy vào kích thước màn hình?". This student wanted to learn about `rem`.
- Gemini, Google, 11:19, Sunday, November 02, 2025 prompt: ".logo trong CSS là thuộc tính có sẵn hay do ta tự đặt ra ở trong một file javascript vậy? (trả lời ngắn gọn):
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}". This student did not know whether .logo is some attribute set by user's code or the CSS's system. He wanted to figure it out.
- Gemini, Google, 13:08, Sunday, November 02, 2025 prompt: "Chỉ tui cách tạo hình này trong dự án của tui đi, javascript cần gì, html cần gì, css cần gì?". Student want a tutorial on how to create a button based on given template. He created a button based on Gemini's tutorial.

### Day Nov 11, 2025
- GPT-5 mini, 9:48, prompt: "Sau khi ấn vô nút title-button thì title-button biến mất, hai nút mới là gambling-button và choose-your-fighter-button sẽ hiện ra". Student learned how to used JS, CSS, HTML through a very concrete example.
- GPT-5 mini, 10:07, prompt: "Bạn hãy tách các giá trị trả về của hàm App ra thành hai trường hợp con đi. Nếu showTitle là true thì return AppTitle, false thì return AppChoosingMode". Student raised the idea and the GenAI took care of the code. Student does not need to know the syntax.
- GPT-5 mini, 10:07, prompt: "Ở trường hợp AppChoosingMode, khi ấn vào nút gambling-button thì sẽ return một hàm khác là AppGamblingMode, nếu ấn vào nút choose-your-fighter-button thì sẽ return một hàm khác là AppChooseYourFighterMode". Student raised the idea and the GenAI took care of the code. Student does not need to know the syntax.
- GPT-5 mini, 10:07, prompt: "Also add a back feature for the AppChoosingMode". Student raised the idea and the GenAI took care of the code. Student does not need to know the syntax.
- GPT-5 mini, 10:07, prompt: "Sau khi ấn vào nút guess-my-mind-button thì chỗ "Hiện ra kết quả Guess my mind" sẽ return một hàm khác là AppGamblingGuessResults". Student raised the idea and the GenAI took care of the code. Student does not need to know the syntax.
- GPT-5 mini, 10:07, prompt: "Thực hiện điều sau:
Làm cho khi mới mở chương trình lên, hai chữ nhật trong className="App", một hình chữ nhật trượt từ trên xuống, một hình chữ nhật trượt từ dưới lên". Student prompted for refering purpose, then modified it to his desire product.

### Day Dec 23, 2025
- Claude Sonnet 4.5, GitHub Copilot, 09:00-12:30, prompt series for implementing search functionality:
  1. "Sau khi nó hiển thị kết quả, nếu người dùng bấm vào kết quả thì hiển thị quán ra cho người dùng xem nhé. Hiển thị thì có thể dùng code ở trong RestaurantDetail.jsx" - Student wanted to show restaurant details when clicking search results. AI implemented RestaurantDetail overlay integration.
  2. "Detail view bạn đừng hiện full-screen mà hiện ra giống bên taste mode á, tức là hiện một phần thôi nhưng mà ở ngoài bạn làm mờ" - Student wanted popup-style detail view instead of fullscreen. AI modified CSS to show modal with blur background.
  3. "Ở trong detail ở trong choose mode nó chưa có scroll được, bạn hãy thêm scroll cho nó" - Student noticed detail view wasn't scrollable. AI added scroll wrapper with hidden scrollbar styling.
  4. "Oke, cái lúc mà hiện ra kết quả thì nếu mà vẫn còn quán chưa hiển thị thì hiển thị lên một cái nút 'Xem thêm'/'Show more' nha" - Student wanted pagination feature. AI implemented incremental loading with "Show more" button that increases limit by 10.
  5. Fixed JSX syntax error with conditional rendering (removed invalid ternary after &&).
  6. "Ủa mà sao mỗi lần tui bấm chữ show more thì nó lại reload lại và nhảy lại từ đầu trang" - Student reported page jumping issue. AI modified to append results instead of replacing, added scroll position preservation, and set button type="button" to prevent form submission.
  7. "It's good, now everytime we trigger the search button, reset the limit to 10 please" - AI fixed limit reset logic for fresh searches.
  8. "Why when searching, the search bar shink or extend based on the length of the search words?" - Student noticed search bar width inconsistency. AI added fixed height, width constraints, and proper box-sizing to maintain consistent dimensions.
  9. "Maybe the problem is with the displaying of the results, when there is some results the width is smaller than when there is no result" - AI identified container width issue and fixed with max-width, overflow-x hidden, and proper flex properties.

### Day Dec 29, 2025
- Claude Sonnet 4.5, GitHub Copilot, 14:00, prompt: "Please modify the algorithm of searching: please adding an scoring algorithm into the food stalls, drink stalls. If the token found in name +5 points, found in tags +4 points, found in reviews +1 points. The higher score a stall has, the sooner it appears in the list." - Student wanted to improve search relevance with weighted scoring. AI modified backend search endpoint to compute scores per token (name +5, tags +4, reviews +1), fetch candidates, score them in Python, sort by score descending, and return top results. This provides more relevant search results with better-matching restaurants appearing first.