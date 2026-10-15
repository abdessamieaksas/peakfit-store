"use client";

import { ImagePlus, LoaderCircle, Trash2 } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { adminProductSchema, inventoryAdjustmentSchema, slugifyProductName } from "@/features/catalog/domain/admin-product";
import type { AdminProductDetail } from "@/features/catalog/server/admin-product-repository";

type Category = { id: string; name: string };
type FormValues = {
  name: string;
  slug: string;
  categoryId: string;
  summary: string;
  description: string;
  priceDh: string | number;
  status: "DRAFT" | "ACTIVE";
  featured: boolean;
  image: string;
  images: string[];
  imageAlt: string;
  colors: string;
  sizes: string;
  initialStock: number;
  benefits: string;
};

type ImageUpload = { id: string; file: File; status: "uploading" | "uploaded" | "error"; progress: number; url?: string; error?: string };

const fieldClass = "mt-2 min-h-11 w-full border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus";
const labelClass = "block text-sm font-bold";

export function AdminProductForm({
  categories,
  images,
  product,
  canUploadImages,
}: {
  categories: Category[];
  images: string[];
  product?: AdminProductDetail;
  canUploadImages: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [banner, setBanner] = useState("");
  const [imageUploads, setImageUploads] = useState<ImageUpload[]>([]);
  const [catalogImage, setCatalogImage] = useState(images[0] ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [discardHref, setDiscardHref] = useState<string | null>(null);
  const allowLeave = useRef(false);
  const [values, setValues] = useState<FormValues>({
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    categoryId: product?.categoryId ?? categories[0]?.id ?? "",
    summary: product?.summary ?? "",
    description: product?.description ?? "",
    priceDh: product ? product.price / 100 : "",
    status: product?.status === "ACTIVE" ? "ACTIVE" : "DRAFT",
    featured: product?.featured ?? false,
    image: product?.image ?? images[0] ?? "",
    images: product?.images.map((image) => image.url) ?? (product?.image ? [product.image] : images[0] ? [images[0]] : []),
    imageAlt: product?.imageAlt ?? "",
    colors: product?.colors.join(", ") ?? "Noir",
    sizes: product?.sizes.join(", ") ?? "S, M, L, XL",
    initialStock: 0,
    benefits: product?.benefits.join("\n") ?? "",
  });
  const [initialValues] = useState<FormValues>(() => values);
  const isDirty = JSON.stringify(values) !== JSON.stringify(initialValues);

  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (allowLeave.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    const onClick = (event: MouseEvent) => {
      if (allowLeave.current || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === "_blank") return;
      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin || destination.href === window.location.href) return;
      event.preventDefault();
      event.stopPropagation();
      setDiscardHref(destination.href);
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("click", onClick, true);
    };
  }, [isDirty]);

  function setField<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function uploadOne(id: string, file: File) {
    return new Promise<void>((resolve) => {
      const formData = new FormData();
      formData.append("file", file, file.name);
      const request = new XMLHttpRequest();
      request.open("POST", "/api/admin/product-images");
      request.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setImageUploads((current) => current.map((item) => item.id === id ? { ...item, progress } : item));
        }
      };
      request.onload = () => {
        let payload: { data?: { url?: string }; error?: { code?: string } } = {};
        try {
          payload = JSON.parse(request.responseText || "{}") as typeof payload;
        } catch {
          payload = {};
        }
        if (request.status >= 200 && request.status < 300 && payload.data?.url) {
          const url = payload.data.url;
          setValues((current) => ({
            ...current,
            images: current.images.includes(url) ? current.images : [...current.images, url],
            image: current.images.length === 0 ? url : current.image,
          }));
          setImageUploads((current) => current.map((item) => item.id === id ? { ...item, status: "uploaded", progress: 100, url } : item));
        } else {
          const code = payload.error?.code;
          const error = code === "IMAGE_STORAGE_NOT_CONFIGURED"
            ? "Le stockage d’images n’est pas configuré sur le serveur."
            : code === "FILE_TOO_LARGE"
              ? "Cette image dépasse la limite de 3 Mo."
              : code === "UNSUPPORTED_IMAGE"
                ? "Utilise une image JPG, PNG ou WebP valide."
                : "Échec de l’envoi. Réessaie sans perdre les autres images.";
          setImageUploads((current) => current.map((item) => item.id === id ? { ...item, status: "error", error } : item));
        }
        resolve();
      };
      request.onerror = () => {
        setImageUploads((current) => current.map((item) => item.id === id ? { ...item, status: "error", error: "Erreur réseau. Vérifie la connexion puis réessaie." } : item));
        resolve();
      };
      request.send(formData);
    });
  }

  async function queueImageFiles(files: FileList | null) {
    if (!files?.length) return;
    setBanner("");
    const candidates = Array.from(files);
    const capacity = Math.max(0, 8 - values.images.length - imageUploads.filter((item) => item.status === "uploading").length);
    if (candidates.length > capacity) setBanner(`Un produit peut contenir 8 images maximum. Il reste ${capacity} emplacement(s).`);
    const accepted: File[] = [];
    for (const file of candidates.slice(0, capacity)) {
      if (!new Set(["image/jpeg", "image/png", "image/webp"]).has(file.type)) {
        setBanner(`${file.name} : utilise un fichier JPG, PNG ou WebP.`);
      } else if (file.size === 0 || file.size > 3 * 1024 * 1024) {
        setBanner(`${file.name} : la taille maximale est de 3 Mo.`);
      } else {
        accepted.push(file);
      }
    }
    for (const file of accepted) {
      const id = crypto.randomUUID();
      setImageUploads((current) => [...current, { id, file, status: "uploading", progress: 0 }]);
      await uploadOne(id, file);
    }
  }

  function addCatalogImage() {
    if (!catalogImage) return;
    setValues((current) => ({
      ...current,
      images: current.images.includes(catalogImage) ? current.images : [...current.images, catalogImage],
      image: current.image || catalogImage,
    }));
  }

  function removeProductImage(url: string) {
    setValues((current) => {
      const nextImages = current.images.filter((item) => item !== url);
      return { ...current, images: nextImages, image: current.image === url ? nextImages[0] ?? "" : current.image };
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBanner("");
    const parsed = adminProductSchema.safeParse(values);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      setBanner(issue?.message ?? "Vérifie les informations du produit.");
      const field = issue?.path[0];
      if (typeof field === "string") document.getElementById(`product-${field}`)?.focus();
      return;
    }
    setPending(true);
    try {
      const response = await fetch(product ? `/api/admin/products/${product.id}` : "/api/admin/products", {
        method: product ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const result = (await response.json()) as { error?: { code?: string; fields?: Record<string, string[]> } };
      if (!response.ok) {
        if (result.error?.code === "UNAUTHORIZED") {
          router.replace("/connexion");
          return;
        }
        const code = result.error?.code;
        const message = code === "CATALOG_CONFLICT"
          ? "Ce lien ou ce SKU existe déjà. Vérifie le nom et les variantes."
          : code === "IMAGE_NOT_AVAILABLE"
            ? "Une image sélectionnée n’est plus disponible. Retire-la de la galerie puis ajoute-la à nouveau."
            : code === "IMAGE_STORAGE_NOT_CONFIGURED"
              ? "Le stockage des photos n’est pas configuré sur le serveur."
            : code === "FORBIDDEN"
              ? "Ton rôle ne permet pas de gérer le catalogue."
              : "Impossible d’enregistrer le produit. Réessaie, les informations saisies sont conservées.";
        throw new Error(message);
      }
      toast.success(product ? "Modifications enregistrées." : "Produit créé.");
      allowLeave.current = true;
      router.push("/admin/produits");
      router.refresh();
    } catch (error) {
      setBanner(error instanceof Error ? error.message : "Impossible d’enregistrer le produit. Réessaie.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
    <form noValidate onSubmit={(event) => void submit(event)} className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="grid content-start gap-7">
        {banner ? <p role="alert" className="border-l-2 border-danger bg-surface p-4 text-sm font-semibold text-danger">{banner}</p> : null}
        <section className="grid gap-5 border border-border bg-surface p-5 sm:p-7" aria-labelledby="product-info-heading">
          <div><p className="text-xs font-extrabold uppercase tracking-[0.14em] text-accent-strong">Fiche produit</p><h2 id="product-info-heading" className="mt-1 font-display text-3xl font-extrabold uppercase">Informations</h2></div>
          <label className={labelClass}>Nom du produit
            <input id="product-name" className={fieldClass} value={values.name} maxLength={180} autoComplete="off" onChange={(event) => {
              const name = event.currentTarget.value;
              setValues((current) => ({ ...current, name, ...(slugTouched ? {} : { slug: slugifyProductName(name) }) }));
            }} />
          </label>
          <label className={labelClass}>Lien du produit
            <input id="product-slug" className={fieldClass} value={values.slug} maxLength={140} onChange={(event) => { setSlugTouched(true); setField("slug", event.currentTarget.value); }} />
            <span className="mt-1 block text-xs font-normal text-muted">Exemple : compression-core-noir</span>
          </label>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className={labelClass}>Catégorie
              <select id="product-categoryId" className={fieldClass} value={values.categoryId} onChange={(event) => setField("categoryId", event.currentTarget.value)}>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>
            <label className={labelClass}>Prix (DH)
              <input id="product-priceDh" inputMode="decimal" className={fieldClass} value={values.priceDh} onChange={(event) => setField("priceDh", event.currentTarget.value)} />
            </label>
          </div>
          <label className={labelClass}>Résumé
            <input id="product-summary" className={fieldClass} value={values.summary} maxLength={400} onChange={(event) => setField("summary", event.currentTarget.value)} />
          </label>
          <label className={labelClass}>Description
            <textarea id="product-description" className={`${fieldClass} min-h-28 resize-none py-3`} rows={4} maxLength={4000} value={values.description} onChange={(event) => setField("description", event.currentTarget.value)} />
          </label>
          <label className={labelClass}>Points forts <span className="font-normal text-muted">(un par ligne)</span>
            <textarea id="product-benefits" className={`${fieldClass} min-h-24 resize-none py-3`} rows={3} maxLength={1200} value={values.benefits} onChange={(event) => setField("benefits", event.currentTarget.value)} />
          </label>
        </section>

        <section className="grid gap-5 border border-border bg-surface p-5 sm:p-7" aria-labelledby="product-options-heading">
          <div><p className="text-xs font-extrabold uppercase tracking-[0.14em] text-accent-strong">Tailles et couleurs</p><h2 id="product-options-heading" className="mt-1 font-display text-3xl font-extrabold uppercase">Variantes</h2></div>
          {product ? (
            <div className="border-l-2 border-border pl-4 text-sm leading-relaxed text-muted">Les variantes sont verrouillées après création pour protéger les commandes existantes. Tu peux ajouter ou retirer du stock par variante ci-dessous.</div>
          ) : (
            <>
              <label className={labelClass}>Couleurs <span className="font-normal text-muted">(séparées par des virgules)</span>
                <input id="product-colors" className={fieldClass} value={values.colors} onChange={(event) => setField("colors", event.currentTarget.value)} />
              </label>
              <label className={labelClass}>Tailles <span className="font-normal text-muted">(séparées par des virgules)</span>
                <input id="product-sizes" className={fieldClass} value={values.sizes} onChange={(event) => setField("sizes", event.currentTarget.value)} />
              </label>
              <label className={labelClass}>Stock initial par variante
                <input id="product-initialStock" type="number" min={0} max={100000} step={1} className={fieldClass} value={values.initialStock} onChange={(event) => setField("initialStock", Number(event.currentTarget.value))} />
                <span className="mt-1 block text-xs font-normal text-muted">{values.colors.split(",").filter((value) => value.trim()).length * values.sizes.split(",").filter((value) => value.trim()).length} variante(s) seront créées avec cette quantité. Ajuste-les ensuite une par une.</span>
              </label>
            </>
          )}
        </section>
      </div>

      <aside className="grid content-start gap-5">
        <section className="grid gap-5 border border-border bg-surface p-5" aria-labelledby="product-media-heading">
          <div><p className="text-xs font-extrabold uppercase tracking-[0.14em] text-accent-strong">Visuels</p><h2 id="product-media-heading" className="mt-1 font-display text-2xl font-extrabold uppercase">Galerie produit</h2><p className="mt-2 text-xs leading-relaxed text-muted">Ajoute tes propres photos ou choisis une image déjà au catalogue. JPG, PNG ou WebP · 3 Mo max par image · 8 images maximum.</p></div>
          <label className="flex min-h-14 cursor-pointer items-center justify-center gap-2 border border-dashed border-border bg-background px-4 text-sm font-extrabold hover:border-accent-strong focus-within:outline-none focus-within:ring-2 focus-within:ring-focus">
            <ImagePlus aria-hidden="true" className="size-5 text-accent-strong" />
            <span>Ajouter mes photos</span>
            <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={!canUploadImages || pending} onChange={(event) => { void queueImageFiles(event.currentTarget.files); event.currentTarget.value = ""; }} />
          </label>
          {!canUploadImages ? <p role="status" className="border-l-2 border-warning bg-background p-3 text-xs leading-relaxed text-muted">Pour activer l’envoi de photos, connecte un stockage Blob au projet Vercel. Les images déjà au catalogue restent disponibles.</p> : null}
          {images.length ? <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            <label className="sr-only" htmlFor="product-catalog-image">Choisir une image déjà au catalogue</label>
            <select id="product-catalog-image" className={fieldClass} value={catalogImage} onChange={(event) => setCatalogImage(event.currentTarget.value)}>
              {images.map((image) => <option key={image} value={image}>{image.split("/").at(-1)}</option>)}
            </select>
            <Button type="button" variant="outline" onClick={addCatalogImage} disabled={values.images.length >= 8}>Ajouter au produit</Button>
          </div> : null}
          {values.images.length ? <ul className="grid grid-cols-2 gap-3" aria-label="Images du produit">
            {values.images.map((image, index) => <li key={image} className={`border p-2 ${values.image === image ? "border-accent-strong" : "border-border"}`}>
              <div className="aspect-[4/5] overflow-hidden bg-background">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt="" className="size-full object-cover" />
              </div>
              <label className="mt-2 flex min-h-10 cursor-pointer items-center gap-2 text-xs font-bold">
                <input type="radio" name="primary-product-image" checked={values.image === image} onChange={() => setField("image", image)} className="accent-[var(--accent-strong)]" />
                {values.image === image ? "Image principale" : `Définir en principale · ${index + 1}`}
              </label>
              <button type="button" className="mt-1 inline-flex min-h-10 items-center gap-1 text-xs font-bold text-danger hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50" onClick={() => removeProductImage(image)} disabled={values.images.length <= 1 || pending}>
                <Trash2 aria-hidden="true" className="size-3.5" />Retirer
              </button>
            </li>)}
          </ul> : <p role="status" className="border border-dashed border-border p-4 text-sm text-muted">Aucune image sélectionnée. Ajoute une photo ou choisis une image du catalogue.</p>}
          {imageUploads.length ? <ul className="grid gap-2" aria-label="État des envois d’images">
            {imageUploads.map((item) => <li key={item.id} className="border border-border p-3 text-xs">
              <div className="flex items-start justify-between gap-3"><span className="min-w-0 break-all font-semibold">{item.file.name}</span><span className="shrink-0 text-muted">{item.status === "uploaded" ? "Ajoutée" : item.status === "uploading" ? `${item.progress}%` : "Échec"}</span></div>
              {item.status === "uploading" ? <progress className="mt-2 h-1.5 w-full accent-[var(--accent-strong)]" max={100} value={item.progress} aria-label={`Envoi de ${item.file.name}`} /> : null}
              {item.error ? <p className="mt-2 text-danger">{item.error}</p> : null}
              <div className="mt-2 flex gap-3">
                {item.status === "error" && canUploadImages ? <button type="button" className="min-h-9 font-bold text-accent-strong underline" onClick={() => { setImageUploads((current) => current.map((row) => row.id === item.id ? { ...row, status: "uploading", progress: 0, error: undefined } : row)); void uploadOne(item.id, item.file); }}>Réessayer</button> : null}
                {item.status !== "uploading" ? <button type="button" className="min-h-9 font-bold text-muted underline" onClick={() => { if (item.url) removeProductImage(item.url); setImageUploads((current) => current.filter((row) => row.id !== item.id)); }}>Retirer de la liste</button> : null}
              </div>
            </li>)}
          </ul> : null}
          <label className={labelClass}>Texte alternatif
            <input id="product-imageAlt" className={fieldClass} value={values.imageAlt} maxLength={240} onChange={(event) => setField("imageAlt", event.currentTarget.value)} />
          </label>
        </section>
        <section className="grid gap-4 border border-border bg-surface p-5">
          <h2 className="font-display text-2xl font-extrabold uppercase">Publication</h2>
          <label className={labelClass}>Visibilité
            <select id="product-status" className={fieldClass} value={values.status} onChange={(event) => setField("status", event.currentTarget.value as FormValues["status"])}>
              <option value="DRAFT">Brouillon</option>
              <option value="ACTIVE">En ligne</option>
            </select>
          </label>
          <label className="flex min-h-11 items-center gap-3 text-sm font-semibold">
            <input type="checkbox" checked={values.featured} onChange={(event) => setField("featured", event.currentTarget.checked)} className="size-4 accent-[var(--accent-strong)]" />
            Mettre en avant sur l’accueil
          </label>
          <Button type="submit" disabled={pending || imageUploads.some((item) => item.status === "uploading") || values.images.length === 0 || categories.length === 0} aria-busy={pending}>
            {pending ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : null}
            {pending ? "Enregistrement…" : product ? "Enregistrer les modifications" : "Créer le produit"}
          </Button>
        </section>
      </aside>
    </form>
    <Dialog.Root open={discardHref !== null} onOpenChange={(open) => { if (!open) setDiscardHref(null); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/55" style={{ zIndex: "var(--z-backdrop)" }} />
        <Dialog.Content role="alertdialog" aria-describedby="product-discard-description" className="fixed left-1/2 top-1/2 w-[min(92vw,30rem)] -translate-x-1/2 -translate-y-1/2 border border-border bg-surface p-6 shadow-2xl focus:outline-none" style={{ zIndex: "var(--z-dialog)" }}>
          <Dialog.Title className="font-display text-3xl font-extrabold uppercase">Quitter sans enregistrer ?</Dialog.Title>
          <Dialog.Description id="product-discard-description" className="mt-3 text-sm leading-relaxed text-muted">Les changements de cette fiche ne seront pas conservés.</Dialog.Description>
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Dialog.Close asChild><Button type="button" variant="outline" onClick={() => setDiscardHref(null)}>Continuer les modifications</Button></Dialog.Close>
            <Button type="button" variant="danger" onClick={() => {
              if (discardHref) {
                allowLeave.current = true;
                window.location.assign(discardHref);
              }
            }}>Quitter la fiche</Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
    </>
  );
}

export function AdminVariantStockForm({ productId, variant }: { productId: string; variant: AdminProductDetail["variants"][number] }) {
  const router = useRouter();
  const [delta, setDelta] = useState(1);
  const [reason, setReason] = useState("Réapprovisionnement");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function adjust(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const parsed = inventoryAdjustmentSchema.safeParse({ delta, reason });
    if (!parsed.success) { setError("Saisis une quantité différente de zéro et le motif de l’ajustement."); return; }
    setPending(true);
    try {
      const response = await fetch(`/api/admin/products/${productId}/variants/${variant.id}/stock`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data),
      });
      const result = (await response.json()) as { error?: { code?: string } };
      if (!response.ok) {
        if (result.error?.code === "UNAUTHORIZED") { router.replace("/connexion"); return; }
        if (result.error?.code === "STOCK_CONFLICT") throw new Error("Stock modifié en parallèle ou quantité réservée. Actualise avant de réessayer.");
        throw new Error("Ajustement non enregistré. Réessaie.");
      }
      toast.success("Stock ajusté et enregistré dans l’historique.");
      setDelta(1);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Ajustement non enregistré. Réessaie.");
    } finally { setPending(false); }
  }

  return (
    <form noValidate onSubmit={(event) => void adjust(event)} className="grid gap-2 sm:grid-cols-[7rem_minmax(10rem,1fr)_auto] sm:items-end">
      <label className="text-xs font-bold text-muted">Ajouter / retirer
        <input type="number" step={1} value={delta} onChange={(event) => setDelta(Number(event.currentTarget.value))} aria-label={`Quantité à ajouter ou retirer pour ${variant.title}`} className="mt-1 min-h-10 w-full border border-border bg-background px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus" />
      </label>
      <label className="text-xs font-bold text-muted">Motif
        <input value={reason} maxLength={240} onChange={(event) => setReason(event.currentTarget.value)} aria-label={`Motif du changement de stock pour ${variant.title}`} className="mt-1 min-h-10 w-full border border-border bg-background px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus" />
      </label>
      <Button type="submit" variant="outline" disabled={pending} aria-busy={pending}>
        {pending ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : null}
        {pending ? "Mise à jour…" : "Ajuster"}
      </Button>
      {error ? <p role="alert" className="text-xs font-semibold text-danger sm:col-span-3">{error}</p> : null}
    </form>
  );
}
