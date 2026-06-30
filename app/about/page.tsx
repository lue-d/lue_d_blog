import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="flex-1 w-full max-w-3xl mx-auto px-6 pt-16 pb-24">
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-serif)] tracking-wide">
            关于我
          </h1>
        </div>

        <div className="prose">
          <p>
            你好，欢迎来到与墨言。
          </p>
          <p>
            这里是我的个人空间，记录书法、摄影和生活里零零散散的感悟。
          </p>
          <p>
            书法是静心之乐，一笔一划间，是与古人对话的仪式。
            摄影让我重新发现自己熟悉的世界——光的形状、影的层次、被忽略的细节。
          </p>
          <p>
            如果你也喜欢这些，很高兴与你相遇。
          </p>

          <h2>联系方式</h2>
          <ul>
            <li>GitHub: <a href="https://github.com/lue-d">@lue-d</a></li>
          </ul>
        </div>
      </main>
      <Footer />
    </>
  );
}
