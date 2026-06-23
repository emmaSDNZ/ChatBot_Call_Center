export default function TopProducts({ data = [] }) {
  const products = data;

  return (
    <div
      className="
        relative
        overflow-hidden
        rounded-3xl
        border border-white/[0.05]
        bg-[#121826]
        p-5
        h-[260px]
      "
    >
      {/* GLOW */}
      <div
        className="
          absolute
          top-0
          right-0
          w-[180px]
          h-[180px]
          bg-white/[0.03]
          blur-[90px]
        "
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-slate-500">
              Servicios Líderes
            </span>

            <h3 className="text-lg font-semibold text-white mt-2">
              Servicios Principales
            </h3>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {products.map((product, index) => (
            <div
              key={index}
              className="
                flex
                items-center
                justify-between
                p-3
                rounded-2xl
                bg-white/[0.03]
                border border-white/[0.04]
              "
            >
              <div>
                <h4 className="text-sm font-medium text-white">
                  {product.name}
                </h4>

                <p className="text-xs text-slate-500 mt-1">{product.sales}</p>
              </div>

              <div
                className="
                  px-2 py-1
                  rounded-full
                  bg-emerald-500/10
                  border border-emerald-500/10
                  text-emerald-300
                  text-xs
                "
              >
                {product.growth}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
