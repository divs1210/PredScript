# PredScript

Compiles to JS, uses it as a VM.

Just like ClojureScript on the JS.

Predicates as Types.

Polymorphic.

```scheme
;; let a: int = 1
;; (def [int? a] 1)

;; (type-of int?) ;; => pred?
;; (type-of pred?);; => pred?


;; builtins:
;; =========
;; - def, defn, degn, let, if, merge-meta!, as, as!, $
;; - bool?, eq?, pred?, int?, not?, vector?, =>, record, maybe
;; - +, *, mod, first, rest, println

(defn [bool? zero?]
  [[int? n]]
  (eq? 0 n))

(defn [bool? zero?]
  [[zero? z]]
  true)

;; (derive int? zero?)
(defn [bool? int?]
  [[zero? z]]
  true)

;;;;;;;;;;;

(defn [pred? vector-of]
  [[pred? p]]
  (merge-meta!
    {:checks [vector-of p]}
    (fn [bool? _]
      [[vector? v]]
      (if (empty? v)
        true
        (let [x (first v)]
          (if (p x)
            ((vector-of p) (rest v))
            false))))))

;; (for-all [X] 
;;   (derive vector? (vector-of X)))
(degn [X] [bool? vector?]
  [[(vector-of X) v]]
  true)


(defn [pred? sized-vector-of]
  [[pred? p] [non-neg-int? s]]
  (merge-meta!
    {:checks [sized-vector-of? p s]}
    (fn [bool? _]
      [[vector? v]]
      (if (and (empty? v)
               (zero? s))
        true
        (let [x (first v)]
          (if (p x)
            ((sized-vector-of p (- s 1)) (rest v))
            false))))))

;; (for-all [X, S]
;;   (derive (vector-of X) (vector-of X S)))
(degn [X S] [bool? vector?]
  [[(sized-vector-of X S) v]]
  true)

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; The `as` operator
;; =================
;; (let [x 0]
;;   (type-of x)) ;; => int?
;;
;; (let [x (as zero? 0)]
;;   (type-of x)) ;; => zero?
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;


;; {:pred int?, :val 0}
;; 
;; (as zero? 0)
;;
;; {:pred zero?, :val 0}


;; inc defined for int?
;; ====================
(defn [int? inc]
  [[int? n]]
  (+ n 1))


;; new types
;; =========
(defn [bool? even?]
  [[int? n]]
  (zero? (mod n 2)))

(defn [bool? even?]
  [[even? n]]
  true)

;; (derive int? even?)
(defn [bool? int?]
  [[even? n]]
  true)


(defn [bool? odd?]
  [[int? n]]
  (not? (even? n)))

(defn [bool? odd?]
  [[odd? n]]
  true)

;; (derive int? odd?)
(defn [bool? int?]
  [[odd? n]]
  true)


(defn [bool? even?]
  [[odd? n]]
  false)

(defn [bool? odd?]
  [[even? n]]
  false)


;; inc defined for new types
;; =========================
(defn [odd? inc]
  [[even? n]]
  (as! odd? 
       (inc (as int? n))))

(defn [even? inc]
  [[odd? n]]
  (as! even?
       (inc (as int? n))))


;; a more complex type
;; ===================
(def [pred? ratio?]
  (sized-vector-of int? 2))

(defn [bool? ratio?]
  [[ratio? r]]
  true)

(defn [ratio? ratio]
  [[int? n]]
  (as! ratio? [n 1]))


(defn [ratio? +]
  [[ratio? x] [ratio? y]]
  (let [[num1 (x 0)]
        [den1 (x 1)]
        [num2 (y 0)]
        [den2 (y 1)]]
    (as! ratio?
         [(+ (* num1 den2)
             (* num2 den1))
          (* den1 den2)])))


(defn [ratio? inc]
  [[ratio? n]]
  (+ n (as! ratio? [1 1])))


;; Generics
;; ========
(degn [X ACC] [ACC reduce]
  [[(=> [ACC X] ACC) f]
   [ACC init]
   [(vector-of X) xs]]
  (if (empty? xs)
    init
    (reduce f 
            (f init (first xs))
            (rest xs))))

(defn [int? sum]
  [[(vector-of int?) xs]]
  (reduce + 0 xs))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(reduce + 0 [0 1 2])        ;; => 3
(reduce str-cat "" [0 1 2]) ;; => "012"
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(degn [X Y S] [(sized-vector-of Y S) map]
  [[(=> [X] Y) f]
   [(sized-vector-of X S) xs]]
  (if (empty? xs)
    init
    (reduce f 
            (f init (first xs))
            (rest xs))))


(degn [X] [(vector-of X) filter]
  [[(=> [X] bool?) pred]
   [(vector-of X) xs]] 
  (if (empty? xs)
    nil
    (let [[x    (first xs)]
          [more (rest  xs)]]
      (if (pred x)
        (cons x (filter pred more))
        (filter pred more)))))


;; Typed maps
;; ==========
(def [pred? pet?]
  (record
    {:name string?
     :legs int?}))

(defn [bool? pet?]
  [[pet? p]]
  true)


(def [pred? user?]
  (record
    {:name string?
     :age  (maybe int?)
     :pets (vector-of pet?)}))

(defn [bool? user?]
  [[user? u]]
  true)

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; runtime validation      ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(defn [user? fetch-user]
  [[int? id]]
  (as user?
      (-> (http/request (str "http://users.com/user/" id))
          (:data)
          (json/load))))
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

;; test
;; ====
(println (inc "hello!"))
;; compile time err: (int? "hello")

(println (type 0))
;; int?

(println (type (inc 1)))
(println (type (inc 2)))
;; int?
;; int?

(println (type (as odd?  3)))
(println (type (as even? 4)))
;; odd?
;; even?

(println (type (inc (as odd?  5))))
(println (type (inc (as even? 6))))
;; even?
;; odd?

(println (type (as even? 7)))
(println (type (as odd?  8)))
;; runtime err: (even? 7)
;; runtime err: (odd?  8)

(println (type (inc (as even? 9))))
(println (type (inc (as odd? 10))))
;; runtime err: (even? 9)
;; runtime err: (odd? 10)

(println (type (inc [1 2])))
(println (type (inc (as ratio? [1 2]))))
;; compile err: inc not defined for (vector-of int? 2)
;; ratio?

(println (type (sum ["a" "b" "c"])))
(println (type (sum [1 2 3])))
;; compile err: sum not defined for (vector-of string? 3)
;; int?
```
